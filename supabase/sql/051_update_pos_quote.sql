create or replace function public.update_pos_quote(
  selected_quote_id bigint,
  customer_tutor_id bigint,
  customer_name text,
  expiration_date date,
  items jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_quote public.pos_quotes%rowtype;
  selected_product public.products%rowtype;
  item jsonb;
  item_quantity integer;
  item_price numeric(12, 2);
  quote_total numeric(12, 2) := 0;
begin
  if not public.current_user_can_access('pdv') then
    raise exception 'Acesso negado ao PDV';
  end if;

  select * into selected_quote
  from public.pos_quotes
  where id = selected_quote_id
  for update;

  if not found or selected_quote.status <> 'Aberto' then
    raise exception 'Somente orçamentos abertos podem ser editados';
  end if;

  if items is null or jsonb_typeof(items) <> 'array' or jsonb_array_length(items) = 0 then
    raise exception 'O orçamento precisa ter ao menos um produto';
  end if;

  if customer_tutor_id is not null and not exists (
    select 1 from public.tutors where id = customer_tutor_id
  ) then
    raise exception 'Cliente inválido';
  end if;

  for item in select * from jsonb_array_elements(items)
  loop
    select * into selected_product
    from public.products
    where id = (item ->> 'product_id')::bigint and ativo = true;

    item_quantity := (item ->> 'quantidade')::integer;
    item_price := (item ->> 'valor_unitario')::numeric;

    if not found or item_quantity <= 0 or item_price < 0 then
      raise exception 'Produto, quantidade ou valor inválido';
    end if;

    quote_total := quote_total + item_quantity * item_price;
  end loop;

  update public.pos_quotes
  set tutor_id = customer_tutor_id,
      cliente_nome = nullif(trim(customer_name), ''),
      validade = expiration_date,
      total = quote_total
  where id = selected_quote_id;

  delete from public.pos_quote_items where quote_id = selected_quote_id;

  for item in select * from jsonb_array_elements(items)
  loop
    select * into selected_product
    from public.products
    where id = (item ->> 'product_id')::bigint;
    item_quantity := (item ->> 'quantidade')::integer;
    item_price := (item ->> 'valor_unitario')::numeric;

    insert into public.pos_quote_items (
      quote_id, product_id, descricao, quantidade, valor_unitario, subtotal
    ) values (
      selected_quote_id,
      selected_product.id,
      selected_product.nome,
      item_quantity,
      item_price,
      item_quantity * item_price
    );
  end loop;
end;
$$;

revoke execute on function public.update_pos_quote(bigint, bigint, text, date, jsonb)
from public, anon;
grant execute on function public.update_pos_quote(bigint, bigint, text, date, jsonb)
to authenticated;
