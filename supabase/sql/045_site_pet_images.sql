create table if not exists public.site_pet_images (
  id bigserial primary key,
  name text not null check (length(btrim(name)) > 0),
  detail text,
  image_url text not null check (length(btrim(image_url)) > 0),
  sort_order integer not null default 100,
  active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

alter table public.site_pet_images enable row level security;

create index if not exists idx_site_pet_images_active_order
  on public.site_pet_images (active, sort_order, id);

revoke all on table public.site_pet_images from anon;
revoke all on table public.site_pet_images from public;
grant select, insert, update, delete on table public.site_pet_images to authenticated;
grant usage, select on sequence public.site_pet_images_id_seq to authenticated;

drop policy if exists "site_pet_images_authenticated_read" on public.site_pet_images;
create policy "site_pet_images_authenticated_read"
on public.site_pet_images
for select
to authenticated
using (public.current_user_can_access('site'));

drop policy if exists "site_pet_images_authenticated_insert" on public.site_pet_images;
create policy "site_pet_images_authenticated_insert"
on public.site_pet_images
for insert
to authenticated
with check (public.current_user_can_access('site'));

drop policy if exists "site_pet_images_authenticated_update" on public.site_pet_images;
create policy "site_pet_images_authenticated_update"
on public.site_pet_images
for update
to authenticated
using (public.current_user_can_access('site'))
with check (public.current_user_can_access('site'));

drop policy if exists "site_pet_images_authenticated_delete" on public.site_pet_images;
create policy "site_pet_images_authenticated_delete"
on public.site_pet_images
for delete
to authenticated
using (public.current_user_can_access('site'));

insert into storage.buckets (id, name, public)
values ('site-pet-images', 'site-pet-images', true)
on conflict (id) do update
set public = excluded.public;

drop policy if exists "site_pet_images_authenticated_storage_insert" on storage.objects;
create policy "site_pet_images_authenticated_storage_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'site-pet-images'
  and public.current_user_can_access('site')
);

drop policy if exists "site_pet_images_authenticated_storage_update" on storage.objects;
create policy "site_pet_images_authenticated_storage_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'site-pet-images'
  and public.current_user_can_access('site')
)
with check (
  bucket_id = 'site-pet-images'
  and public.current_user_can_access('site')
);

drop policy if exists "site_pet_images_authenticated_storage_delete" on storage.objects;
create policy "site_pet_images_authenticated_storage_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'site-pet-images'
  and public.current_user_can_access('site')
);

create or replace function public.public_site_catalog()
returns jsonb
language sql
security definer
set search_path = public
as $$
  with service_rows as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', id,
          'nome', nome
        )
        order by nome
      ),
      '[]'::jsonb
    ) as data
    from public.services
    where coalesce(ativo, true) = true
  ),
  product_rows as (
    select
      id,
      coalesce(nullif(btrim(nome), ''), nullif(btrim(name), ''), 'Produto') as nome,
      coalesce(categoria, category, '') as categoria,
      coalesce(tamanho, '') as tamanho,
      coalesce(cor, '') as cor,
      nullif(btrim(coalesce(image_url, '')), '') as image_url,
      greatest(coalesce(estoque, 0), coalesce(stock_quantity, 0)) as estoque,
      lower(
        coalesce(nome, '') || ' ' ||
        coalesce(name, '') || ' ' ||
        coalesce(categoria, '') || ' ' ||
        coalesce(category, '') || ' ' ||
        coalesce(tamanho, '') || ' ' ||
        coalesce(cor, '')
      ) as search_text
    from public.products
    where coalesce(ativo, active, true) = true
      and greatest(coalesce(estoque, 0), coalesce(stock_quantity, 0)) > 0
  ),
  accessory_rows as (
    select
      coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id', id,
            'nome', nome,
            'categoria', categoria,
            'tamanho', tamanho,
            'cor', cor,
            'estoque', estoque,
            'image_url', image_url
          )
          order by nome, id
        ) filter (where search_text like '%bandana%'),
        '[]'::jsonb
      ) as bandanas,
      coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id', id,
            'nome', nome,
            'categoria', categoria,
            'tamanho', tamanho,
            'cor', cor,
            'estoque', estoque,
            'image_url', image_url
          )
          order by nome, id
        ) filter (
          where search_text like '%lacinho%'
             or search_text like '%laco%'
             or search_text like '%la_o%'
        ),
        '[]'::jsonb
      ) as bows
    from product_rows
  ),
  pet_image_rows as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', id,
          'name', name,
          'detail', detail,
          'image_url', image_url
        )
        order by sort_order, id
      ),
      '[]'::jsonb
    ) as data
    from public.site_pet_images
    where active = true
      and nullif(btrim(image_url), '') is not null
  )
  select jsonb_build_object(
    'services', service_rows.data,
    'accessories', jsonb_build_object(
      'bandanas', accessory_rows.bandanas,
      'bows', accessory_rows.bows
    ),
    'petImages', pet_image_rows.data
  )
  from service_rows, accessory_rows, pet_image_rows;
$$;

revoke all on function public.public_site_catalog() from public;
grant execute on function public.public_site_catalog() to anon, authenticated;
