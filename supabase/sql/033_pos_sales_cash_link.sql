-- 033_pos_sales_cash_link.sql
-- Vincula vendas do PDV ao caixa aberto e registra venda/estorno no movimento.

begin;

alter table public.pos_sales
add column if not exists cash_register_id bigint
references public.pos_cash_registers(id) on delete set null;

alter table public.pos_cash_movements
add column if not exists sale_id bigint
references public.pos_sales(id) on delete set null;

alter table public.pos_cash_movements
drop constraint if exists pos_cash_movements_movement_type_check;

alter table public.pos_cash_movements
add constraint pos_cash_movements_movement_type_check
check (
  movement_type in (
    'abertura',
    'suprimento',
    'sangria',
    'venda',
    'cancelamento_venda',
    'fechamento'
  )
);

create index if not exists idx_pos_sales_cash_register_id
on public.pos_sales(cash_register_id);

create index if not exists idx_pos_cash_movements_sale_id
on public.pos_cash_movements(sale_id);

create or replace function public.recalculate_pos_cash_expected(
  selected_register_id bigint
)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(register.opening_amount, 0)
    + coalesce(sum(
      case
        when movement.movement_type in ('suprimento', 'venda') then movement.amount
        when movement.movement_type in ('sangria', 'cancelamento_venda') then -movement.amount
        else 0
      end
    ), 0)
  from public.pos_cash_registers register
  left join public.pos_cash_movements movement
    on movement.cash_register_id = register.id
  where register.id = selected_register_id
  group by register.opening_amount;
$$;

create or replace function public.create_pos_sale(
  customer_tutor_id bigint,
  customer_name text,
  payment_method text,
  items jsonb
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  new_sale_id bigint;
  open_register_id bigint;
  item jsonb;
  sale_total numeric(12, 2) := 0;
  product_record public.products%rowtype;
  item_quantity integer;
begin
  if not public.current_user_can_access('pdv') then
    raise exception 'Acesso negado ao PDV';
  end if;

  select id into open_register_id
  from public.pos_cash_registers
  where status = 'Aberto'
  order by opened_at desc
  limit 1
  for update;

  if open_register_id is null then
    raise exception 'Abra um caixa antes de finalizar a venda';
  end if;

  if items is null
    or jsonb_typeof(items) <> 'array'
    or jsonb_array_length(items) = 0
  then
    raise exception 'A venda precisa ter ao menos um item';
  end if;

  for item in select * from jsonb_array_elements(items)
  loop
    select * into product_record
    from public.products
    where id = (item ->> 'product_id')::bigint
      and ativo = true
    for update;

    if not found then
      raise exception 'Produto invalido';
    end if;

    item_quantity := (item ->> 'quantidade')::integer;
    if item_quantity <= 0 or product_record.estoque < item_quantity then
      raise exception 'Estoque insuficiente para %', product_record.nome;
    end if;

    sale_total := sale_total + (product_record.preco_venda * item_quantity);
  end loop;

  insert into public.pos_sales (
    tutor_id,
    cliente_nome,
    total,
    forma_pagamento,
    cash_register_id
  )
  values (
    customer_tutor_id,
    nullif(trim(customer_name), ''),
    sale_total,
    payment_method,
    open_register_id
  )
  returning id into new_sale_id;

  for item in select * from jsonb_array_elements(items)
  loop
    select * into product_record
    from public.products
    where id = (item ->> 'product_id')::bigint
    for update;

    item_quantity := (item ->> 'quantidade')::integer;

    insert into public.pos_sale_items (
      sale_id,
      product_id,
      descricao,
      quantidade,
      valor_unitario,
      subtotal
    )
    values (
      new_sale_id,
      product_record.id,
      product_record.nome,
      item_quantity,
      product_record.preco_venda,
      product_record.preco_venda * item_quantity
    );

    update public.products
    set
      estoque = estoque - item_quantity,
      updated_at = now()
    where id = product_record.id;
  end loop;

  insert into public.financial_entries (
    descricao,
    valor,
    tipo,
    forma_pagamento,
    status_pagamento
  )
  values (
    format(
      'Venda PDV #%s - %s',
      new_sale_id,
      coalesce(nullif(trim(customer_name), ''), 'Consumidor')
    ),
    sale_total,
    'Receita',
    payment_method,
    'Pago'
  );

  insert into public.pos_cash_movements (
    cash_register_id,
    movement_type,
    amount,
    sale_id,
    notes,
    created_by
  )
  values (
    open_register_id,
    'venda',
    sale_total,
    new_sale_id,
    format('Venda PDV #%s', new_sale_id),
    (select auth.uid())
  );

  update public.pos_cash_registers
  set expected_amount = public.recalculate_pos_cash_expected(open_register_id)
  where id = open_register_id;

  return new_sale_id;
end;
$$;

create or replace function public.cancel_pos_sale(selected_sale_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_sale public.pos_sales%rowtype;
  sale_item record;
  selected_register_status text;
begin
  if not public.current_user_can_access('pdv') then
    raise exception 'Acesso negado ao PDV';
  end if;

  select * into selected_sale
  from public.pos_sales
  where id = selected_sale_id
  for update;

  if not found then
    raise exception 'Venda nao encontrada';
  end if;

  if selected_sale.status = 'Cancelada' then
    raise exception 'Venda ja cancelada';
  end if;

  for sale_item in
    select product_id, quantidade
    from public.pos_sale_items
    where sale_id = selected_sale_id
      and product_id is not null
  loop
    update public.products
    set
      estoque = estoque + sale_item.quantidade,
      updated_at = now()
    where id = sale_item.product_id;
  end loop;

  delete from public.financial_entries
  where (
    origem = 'Venda PDV'
    and referencia_id = selected_sale_id
  )
  or descricao like format('Venda PDV #%s - %%', selected_sale_id);

  if selected_sale.cash_register_id is not null then
    select status into selected_register_status
    from public.pos_cash_registers
    where id = selected_sale.cash_register_id
    for update;

    if selected_register_status = 'Aberto' then
      insert into public.pos_cash_movements (
        cash_register_id,
        movement_type,
        amount,
        sale_id,
        notes,
        created_by
      )
      values (
        selected_sale.cash_register_id,
        'cancelamento_venda',
        selected_sale.total,
        selected_sale_id,
        format('Cancelamento da venda PDV #%s', selected_sale_id),
        (select auth.uid())
      );

      update public.pos_cash_registers
      set expected_amount = public.recalculate_pos_cash_expected(
        selected_sale.cash_register_id
      )
      where id = selected_sale.cash_register_id;
    end if;
  end if;

  update public.pos_sales
  set status = 'Cancelada'
  where id = selected_sale_id;
end;
$$;

revoke execute on function public.recalculate_pos_cash_expected(bigint)
from public, anon;
grant execute on function public.recalculate_pos_cash_expected(bigint)
to authenticated;

revoke execute on function public.create_pos_sale(bigint, text, text, jsonb)
from public, anon;
grant execute on function public.create_pos_sale(bigint, text, text, jsonb)
to authenticated;

revoke execute on function public.cancel_pos_sale(bigint)
from public, anon;
grant execute on function public.cancel_pos_sale(bigint)
to authenticated;

commit;
