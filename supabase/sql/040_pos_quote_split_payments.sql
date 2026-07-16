-- 040_pos_quote_split_payments.sql
-- Permite converter orçamentos do PDV em vendas com pagamentos divididos.

begin;

create or replace function public.convert_pos_quote_with_payments(
  selected_quote_id bigint,
  payments jsonb
)
returns bigint
language plpgsql
security definer
set search_path = ''
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
      'product_id', product_id,
      'quantidade', quantidade
    )
  )
  into sale_items
  from public.pos_quote_items
  where quote_id = selected_quote_id
    and product_id is not null;

  if sale_items is null or jsonb_array_length(sale_items) = 0 then
    raise exception 'Orçamento sem produtos válidos';
  end if;

  new_sale_id := public.create_pos_sale_with_payments(
    selected_quote.tutor_id,
    selected_quote.cliente_nome,
    sale_items,
    payments
  );

  update public.pos_quotes
  set status = 'Convertido'
  where id = selected_quote_id;

  return new_sale_id;
end;
$$;

revoke execute on function public.convert_pos_quote_with_payments(
  bigint,
  jsonb
) from public, anon;

grant execute on function public.convert_pos_quote_with_payments(
  bigint,
  jsonb
) to authenticated;

commit;
