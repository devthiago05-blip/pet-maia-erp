-- 046_pos_stocktake.sql
-- Finalizacao atomica de balanco fisico de estoque no PDV.

begin;

create or replace function public.complete_product_stocktake(
  items jsonb,
  notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  item jsonb;
  selected_product public.products%rowtype;
  selected_product_id bigint;
  counted_quantity integer;
  changed_count integer := 0;
  unchanged_count integer := 0;
  total_difference integer := 0;
  processed_ids bigint[] := '{}';
  normalized_notes text := nullif(btrim(notes), '');
begin
  if (select auth.uid()) is null then
    raise exception 'Usuario nao autenticado';
  end if;

  if not public.current_user_can_access('pdv') then
    raise exception 'Acesso negado ao balanco de estoque';
  end if;

  if jsonb_typeof(items) <> 'array' or jsonb_array_length(items) = 0 then
    raise exception 'Adicione ao menos um produto ao balanco';
  end if;

  for item in select value from jsonb_array_elements(items)
  loop
    if coalesce(item->>'product_id', '') !~ '^[0-9]+$' then
      raise exception 'Produto invalido no balanco';
    end if;

    if coalesce(item->>'counted_quantity', '') !~ '^[0-9]+$' then
      raise exception 'Quantidade contada invalida';
    end if;

    selected_product_id := (item->>'product_id')::bigint;
    counted_quantity := (item->>'counted_quantity')::integer;

    if selected_product_id = any(processed_ids) then
      raise exception 'Produto duplicado no balanco';
    end if;

    processed_ids := array_append(processed_ids, selected_product_id);

    select * into selected_product
    from public.products
    where id = selected_product_id
      and coalesce(ativo, true) = true
    for update;

    if not found then
      raise exception 'Produto nao encontrado ou inativo: %', selected_product_id;
    end if;

    total_difference := total_difference + counted_quantity - selected_product.estoque;

    if counted_quantity = selected_product.estoque then
      unchanged_count := unchanged_count + 1;
      continue;
    end if;

    perform set_config('pet_maia.stock_kind', 'inventario', true);
    perform set_config(
      'pet_maia.stock_reason',
      'Balanco de estoque' ||
        case when normalized_notes is null then '' else ': ' || normalized_notes end,
      true
    );
    perform set_config('pet_maia.stock_batch', '', true);
    perform set_config('pet_maia.stock_expiration', '', true);

    update public.products
    set
      estoque = counted_quantity,
      stock_quantity = counted_quantity,
      updated_at = now()
    where id = selected_product_id;

    changed_count := changed_count + 1;
  end loop;

  return jsonb_build_object(
    'processed_count', jsonb_array_length(items),
    'changed_count', changed_count,
    'unchanged_count', unchanged_count,
    'total_difference', total_difference
  );
end;
$$;

revoke execute on function public.complete_product_stocktake(jsonb, text)
from public, anon;
grant execute on function public.complete_product_stocktake(jsonb, text)
to authenticated;

commit;
