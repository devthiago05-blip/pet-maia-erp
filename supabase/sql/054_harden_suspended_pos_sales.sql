drop policy if exists suspended_pos_sales_insert on public.suspended_pos_sales;
create policy suspended_pos_sales_insert on public.suspended_pos_sales for insert to authenticated
with check (public.current_user_can_access('pdv') and created_by = auth.uid());
drop policy if exists suspended_pos_sales_delete on public.suspended_pos_sales;
create policy suspended_pos_sales_delete on public.suspended_pos_sales for delete to authenticated
using (public.current_user_can_access('pdv'));
drop policy if exists suspended_pos_sale_items_insert on public.suspended_pos_sale_items;
create policy suspended_pos_sale_items_insert on public.suspended_pos_sale_items for insert to authenticated
with check (public.current_user_can_access('pdv') and exists (select 1 from public.suspended_pos_sales sale where sale.id = suspended_sale_id and sale.created_by = auth.uid()));
grant select, insert, delete on public.suspended_pos_sales to authenticated;
grant select, insert on public.suspended_pos_sale_items to authenticated;
grant usage, select on sequence public.suspended_pos_sales_id_seq, public.suspended_pos_sale_items_id_seq to authenticated;
alter function public.suspend_pos_sale(bigint,text,text,jsonb) security invoker;
alter function public.delete_suspended_pos_sale(bigint) security invoker;
