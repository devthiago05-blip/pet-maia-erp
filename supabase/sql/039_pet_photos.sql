alter table public.pets
add column if not exists photo_url text;

insert into storage.buckets (id, name, public)
values ('pet-photos', 'pet-photos', true)
on conflict (id) do update
set public = excluded.public;

drop policy if exists "pet_photos_public_read" on storage.objects;

drop policy if exists "pet_photos_authenticated_insert" on storage.objects;
create policy "pet_photos_authenticated_insert"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'pet-photos');

drop policy if exists "pet_photos_authenticated_update" on storage.objects;
create policy "pet_photos_authenticated_update"
on storage.objects
for update
to authenticated
using (bucket_id = 'pet-photos')
with check (bucket_id = 'pet-photos');

drop policy if exists "pet_photos_authenticated_delete" on storage.objects;
create policy "pet_photos_authenticated_delete"
on storage.objects
for delete
to authenticated
using (bucket_id = 'pet-photos');
