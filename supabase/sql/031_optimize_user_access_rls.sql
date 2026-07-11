-- 031_optimize_user_access_rls.sql
-- Otimiza policies e funcoes de acesso para evitar reavaliacao de auth.uid()
-- por linha nas consultas protegidas por RLS.

begin;

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
    where id = (select auth.uid())
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
    where profile.id = (select auth.uid())
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

drop policy if exists "Users can read own profile" on public.user_profiles;
create policy "Users can read own profile"
on public.user_profiles
for select
to authenticated
using (
  id = (select auth.uid())
  or public.current_user_is_admin()
);

drop policy if exists "Users can read own permissions" on public.user_permissions;
create policy "Users can read own permissions"
on public.user_permissions
for select
to authenticated
using (
  user_id = (select auth.uid())
  or public.current_user_is_admin()
);

revoke execute on function public.current_user_is_admin() from public, anon;
grant execute on function public.current_user_is_admin() to authenticated;

revoke execute on function public.current_user_can_access(text) from public, anon;
grant execute on function public.current_user_can_access(text) to authenticated;

commit;
