begin;

alter table public.pos_sales
add column if not exists status text not null default 'Concluída'
check (status in ('Concluída', 'Cancelada'));

create or replace function public.cancel_pos_sale(selected_sale_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_sale public.pos_sales%rowtype;
  sale_item record;
begin
  if not public.current_user_can_access('pdv') then
    raise exception 'Acesso negado ao PDV';
  end if;

  select * into selected_sale
  from public.pos_sales
  where id = selected_sale_id
  for update;

  if not found then
    raise exception 'Venda não encontrada';
  end if;

  if selected_sale.status = 'Cancelada' then
    raise exception 'Venda já cancelada';
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

  update public.pos_sales
  set status = 'Cancelada'
  where id = selected_sale_id;
end;
$$;

revoke all on function public.cancel_pos_sale(bigint) from public;
grant execute on function public.cancel_pos_sale(bigint) to authenticated;

commit;
