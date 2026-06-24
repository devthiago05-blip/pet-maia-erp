begin;

alter table public.financial_entries
add column if not exists data_vencimento date;

alter table public.financial_entries
add column if not exists origem text;

alter table public.financial_entries
add column if not exists referencia_id bigint;

alter table public.product_purchases
add column if not exists data_vencimento date;

alter table public.product_purchases
add column if not exists forma_pagamento text;

alter table public.product_purchases
add column if not exists financial_entry_id bigint
references public.financial_entries(id) on delete set null;

drop function if exists public.create_product_purchase(
  bigint,
  text,
  date,
  text,
  jsonb
);

create function public.create_product_purchase(
  selected_supplier_id bigint,
  document_number text,
  purchase_date date,
  due_date date,
  payment_method text,
  notes text,
  items jsonb
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  new_purchase_id bigint;
  new_financial_entry_id bigint;
  purchase_total numeric(12, 2) := 0;
  item jsonb;
  selected_product public.products%rowtype;
  selected_supplier public.suppliers%rowtype;
  item_quantity integer;
  item_cost numeric(12, 2);
begin
  if not public.current_user_can_access('pdv') then
    raise exception 'Acesso negado ao PDV';
  end if;

  select * into selected_supplier
  from public.suppliers
  where id = selected_supplier_id and ativo = true;

  if not found then
    raise exception 'Fornecedor inválido';
  end if;

  if items is null
    or jsonb_typeof(items) <> 'array'
    or jsonb_array_length(items) = 0
  then
    raise exception 'A compra precisa ter ao menos um item';
  end if;

  for item in select * from jsonb_array_elements(items)
  loop
    select * into selected_product
    from public.products
    where id = (item ->> 'product_id')::bigint
    for update;

    if not found then
      raise exception 'Produto inválido';
    end if;

    item_quantity := (item ->> 'quantidade')::integer;
    item_cost := (item ->> 'custo_unitario')::numeric;

    if item_quantity <= 0 or item_cost < 0 then
      raise exception 'Quantidade ou custo inválido';
    end if;

    purchase_total := purchase_total + (item_quantity * item_cost);
  end loop;

  insert into public.financial_entries (
    descricao,
    valor,
    tipo,
    forma_pagamento,
    status_pagamento,
    data_vencimento,
    origem
  )
  values (
    format(
      'Compra de produtos - %s%s',
      selected_supplier.nome,
      case
        when nullif(trim(document_number), '') is null then ''
        else format(' - Documento %s', trim(document_number))
      end
    ),
    purchase_total,
    'Despesa',
    nullif(trim(payment_method), ''),
    'Pendente',
    coalesce(due_date, purchase_date, current_date),
    'Compra PDV'
  )
  returning id into new_financial_entry_id;

  insert into public.product_purchases (
    supplier_id,
    numero_documento,
    data_compra,
    data_vencimento,
    forma_pagamento,
    total,
    observacao,
    financial_entry_id
  )
  values (
    selected_supplier_id,
    nullif(trim(document_number), ''),
    coalesce(purchase_date, current_date),
    coalesce(due_date, purchase_date, current_date),
    nullif(trim(payment_method), ''),
    purchase_total,
    nullif(trim(notes), ''),
    new_financial_entry_id
  )
  returning id into new_purchase_id;

  update public.financial_entries
  set referencia_id = new_purchase_id
  where id = new_financial_entry_id;

  for item in select * from jsonb_array_elements(items)
  loop
    select * into selected_product
    from public.products
    where id = (item ->> 'product_id')::bigint
    for update;

    item_quantity := (item ->> 'quantidade')::integer;
    item_cost := (item ->> 'custo_unitario')::numeric;

    insert into public.product_purchase_items (
      purchase_id,
      product_id,
      quantidade,
      custo_unitario,
      subtotal
    )
    values (
      new_purchase_id,
      selected_product.id,
      item_quantity,
      item_cost,
      item_quantity * item_cost
    );

    update public.products
    set
      estoque = estoque + item_quantity,
      preco_custo = item_cost,
      updated_at = now()
    where id = selected_product.id;
  end loop;

  return new_purchase_id;
end;
$$;

revoke all on function public.create_product_purchase(
  bigint,
  text,
  date,
  date,
  text,
  text,
  jsonb
) from public;

grant execute on function public.create_product_purchase(
  bigint,
  text,
  date,
  date,
  text,
  text,
  jsonb
) to authenticated;

create or replace function public.convert_pos_quote(
  selected_quote_id bigint,
  payment_method text
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_quote public.pos_quotes%rowtype;
  sale_items jsonb;
  new_sale_id bigint;
begin
  if not public.current_user_can_access('pdv') then
    raise exception 'Acesso negado ao PDV';
  end if;

  select * into selected_quote
  from public.pos_quotes
  where id = selected_quote_id
  for update;

  if not found or selected_quote.status <> 'Aberto' then
    raise exception 'Orçamento não está disponível para conversão';
  end if;

  select jsonb_agg(
    jsonb_build_object(
      'product_id',
      product_id,
      'quantidade',
      quantidade
    )
  )
  into sale_items
  from public.pos_quote_items
  where quote_id = selected_quote_id
    and product_id is not null;

  if sale_items is null or jsonb_array_length(sale_items) = 0 then
    raise exception 'Orçamento sem produtos válidos';
  end if;

  new_sale_id := public.create_pos_sale(
    selected_quote.tutor_id,
    selected_quote.cliente_nome,
    payment_method,
    sale_items
  );

  update public.pos_quotes
  set status = 'Convertido'
  where id = selected_quote_id;

  return new_sale_id;
end;
$$;

revoke all on function public.convert_pos_quote(bigint, text) from public;
grant execute on function public.convert_pos_quote(bigint, text)
to authenticated;

commit;
