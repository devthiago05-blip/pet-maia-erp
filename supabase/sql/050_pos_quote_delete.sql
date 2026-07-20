drop policy if exists "PDV users can delete quotes" on public.pos_quotes;
create policy "PDV users can delete quotes"
on public.pos_quotes for delete to authenticated
using (public.current_user_can_access('pdv'));

grant delete on public.pos_quotes to authenticated;
