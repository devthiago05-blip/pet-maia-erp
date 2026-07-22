create or replace function public.delete_product_purchase(
  selected_purchase_id bigint
) returns text[]
language plpgsql
security definer
set search_path = ''
as $$
declare
  purchase_record public.product_purchases%rowtype;
  item_record record;
  financial_ids bigint[];
  storage_paths text[];
begin
  if auth.uid() is null or not public.current_user_can_access('pdv') then
    raise exception 'Acesso negado ao PDV';
  end if;

  select * into purchase_record
  from public.product_purchases
  where id = selected_purchase_id
  for update;

  if not found then
    raise exception 'Compra não encontrada';
  end if;

  for item_record in
    select
      purchase_item.product_id,
      sum(
        purchase_item.quantidade *
        greatest(coalesce(product.units_per_purchase, 1), 1)
      )::integer as units_to_reverse,
      max(product.nome) as product_name
    from public.product_purchase_items purchase_item
    join public.products product on product.id = purchase_item.product_id
    where purchase_item.purchase_id = selected_purchase_id
    group by purchase_item.product_id
  loop
    perform 1
    from public.products
    where id = item_record.product_id
    for update;

    if (select estoque from public.products where id = item_record.product_id)
       < item_record.units_to_reverse then
      raise exception
        'Não é possível excluir: o estoque atual de % é menor que as % unidades desta importação',
        item_record.product_name, item_record.units_to_reverse;
    end if;
  end loop;

  select array_agg(distinct financial_entry_id)
  into financial_ids
  from (
    select financial_entry_id
    from public.product_purchase_payments
    where purchase_id = selected_purchase_id
      and financial_entry_id is not null
    union
    select purchase_record.financial_entry_id
    where purchase_record.financial_entry_id is not null
  ) linked_financial_entries;

  select coalesce(array_agg(storage_path), array[]::text[])
  into storage_paths
  from public.purchase_documents
  where destination_kind = 'pdv'
    and linked_record_id = selected_purchase_id;

  for item_record in
    select
      purchase_item.product_id,
      sum(
        purchase_item.quantidade *
        greatest(coalesce(product.units_per_purchase, 1), 1)
      )::integer as units_to_reverse
    from public.product_purchase_items purchase_item
    join public.products product on product.id = purchase_item.product_id
    where purchase_item.purchase_id = selected_purchase_id
    group by purchase_item.product_id
  loop
    perform set_config('pet_maia.stock_kind', 'saida', true);
    perform set_config(
      'pet_maia.stock_reason',
      format(
        'Exclusão da importação/compra #%s: reversão de %s unidade(s)',
        selected_purchase_id,
        item_record.units_to_reverse
      ),
      true
    );

    update public.products
    set estoque = estoque - item_record.units_to_reverse,
        stock_quantity = estoque - item_record.units_to_reverse,
        updated_at = now()
    where id = item_record.product_id;
  end loop;

  delete from public.purchase_documents
  where destination_kind = 'pdv'
    and linked_record_id = selected_purchase_id;

  delete from public.product_purchases
  where id = selected_purchase_id;

  if coalesce(array_length(financial_ids, 1), 0) > 0 then
    delete from public.financial_entries
    where id = any(financial_ids);
  end if;

  delete from public.financial_entries
  where origem = 'Compra PDV'
    and referencia_id = selected_purchase_id;

  return storage_paths;
end;
$$;

revoke all on function public.delete_product_purchase(bigint)
  from public, anon, authenticated;
grant execute on function public.delete_product_purchase(bigint)
  to authenticated;
