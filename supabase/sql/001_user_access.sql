begin;

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null default '',
  email text not null,
  ativo boolean not null default true,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_permissions (
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  module text not null check (
    module in (
      'dashboard',
      'tutores',
      'pets',
      'servicos',
      'agenda',
      'financeiro',
      'recibos',
      'relatorios',
      'configuracoes',
      'usuarios'
    )
  ),
  can_access boolean not null default false,
  primary key (user_id, module)
);

create or replace function public.create_default_user_permissions(target_user_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.user_permissions (user_id, module, can_access)
  select
    target_user_id,
    module,
    false
  from unnest(
    array[
      'dashboard',
      'tutores',
      'pets',
      'servicos',
      'agenda',
      'financeiro',
      'recibos',
      'relatorios',
      'configuracoes',
      'usuarios'
    ]
  ) as modules(module)
  on conflict (user_id, module) do nothing;
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (id, nome, email)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'nome',
      split_part(coalesce(new.email, ''), '@', 1),
      ''
    ),
    coalesce(new.email, '')
  )
  on conflict (id) do update
  set
    nome = excluded.nome,
    email = excluded.email,
    updated_at = now();

  perform public.create_default_user_permissions(new.id);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert or update of email, raw_user_meta_data on auth.users
for each row execute function public.handle_new_auth_user();

insert into public.user_profiles (id, nome, email)
select
  id,
  coalesce(
    raw_user_meta_data ->> 'nome',
    split_part(coalesce(email, ''), '@', 1),
    ''
  ),
  coalesce(email, '')
from auth.users
on conflict (id) do update
set
  nome = excluded.nome,
  email = excluded.email,
  updated_at = now();

do $$
declare
  existing_user record;
begin
  for existing_user in select id from public.user_profiles loop
    perform public.create_default_user_permissions(existing_user.id);
  end loop;
end;
$$;

update public.user_profiles
set is_admin = true
where id = (
  select id
  from auth.users
  order by created_at asc
  limit 1
)
and not exists (
  select 1
  from public.user_profiles
  where is_admin = true
);

update public.user_permissions
set can_access = true
where user_id in (
  select id
  from public.user_profiles
  where is_admin = true
);

create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_profiles
    where id = auth.uid()
      and ativo = true
      and is_admin = true
  );
$$;

create or replace function public.current_user_can_access(requested_module text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_profiles profile
    where profile.id = auth.uid()
      and profile.ativo = true
      and (
        profile.is_admin = true
        or exists (
          select 1
          from public.user_permissions permission
          where permission.user_id = profile.id
            and permission.module = requested_module
            and permission.can_access = true
        )
      )
  );
$$;

alter table public.user_profiles enable row level security;
alter table public.user_permissions enable row level security;

drop policy if exists "Users can read own profile" on public.user_profiles;
create policy "Users can read own profile"
on public.user_profiles
for select
to authenticated
using (id = auth.uid() or public.current_user_is_admin());

drop policy if exists "Users can read own permissions" on public.user_permissions;
create policy "Users can read own permissions"
on public.user_permissions
for select
to authenticated
using (user_id = auth.uid() or public.current_user_is_admin());

revoke all on public.user_profiles from anon;
revoke all on public.user_permissions from anon;
revoke all on function public.create_default_user_permissions(uuid) from public;
revoke all on function public.handle_new_auth_user() from public;
revoke all on function public.current_user_is_admin() from public;
revoke all on function public.current_user_can_access(text) from public;
grant select on public.user_profiles to authenticated;
grant select on public.user_permissions to authenticated;
grant execute on function public.current_user_is_admin() to authenticated;
grant execute on function public.current_user_can_access(text) to authenticated;

commit;
