alter table public.products
add column if not exists image_url text;

insert into storage.buckets (id, name, public)
values ('site-accessories', 'site-accessories', true)
on conflict (id) do update
set public = excluded.public;

drop policy if exists "site_accessories_public_read" on storage.objects;
create policy "site_accessories_public_read"
on storage.objects
for select
to public
using (bucket_id = 'site-accessories');

drop policy if exists "site_accessories_authenticated_insert" on storage.objects;
create policy "site_accessories_authenticated_insert"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'site-accessories');

drop policy if exists "site_accessories_authenticated_update" on storage.objects;
create policy "site_accessories_authenticated_update"
on storage.objects
for update
to authenticated
using (bucket_id = 'site-accessories')
with check (bucket_id = 'site-accessories');

drop policy if exists "site_accessories_authenticated_delete" on storage.objects;
create policy "site_accessories_authenticated_delete"
on storage.objects
for delete
to authenticated
using (bucket_id = 'site-accessories');
