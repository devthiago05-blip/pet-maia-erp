begin;

alter table public.user_permissions
drop constraint if exists user_permissions_module_check;

alter table public.user_permissions
add constraint user_permissions_module_check check (
  module in (
    'dashboard',
    'tutores',
    'pets',
    'servicos',
    'agenda',
    'financeiro',
    'recibos',
    'relatorios',
    'pdv',
    'clinica',
    'configuracoes',
    'usuarios'
  )
);

insert into public.user_permissions (user_id, module, can_access)
select
  profile.id,
  'clinica',
  profile.is_admin or coalesce(pets_permission.can_access, false)
from public.user_profiles as profile
left join public.user_permissions as pets_permission
  on pets_permission.user_id = profile.id
  and pets_permission.module = 'pets'
on conflict (user_id, module) do nothing;

create or replace function public.create_default_user_permissions(
  target_user_id uuid
)
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
      'pdv',
      'clinica',
      'configuracoes',
      'usuarios'
    ]
  ) as modules(module)
  on conflict (user_id, module) do nothing;
$$;

drop policy if exists "Pet users can manage clinical records"
on public.clinical_records;

create policy "Clinic users can manage clinical records"
on public.clinical_records for all to authenticated
using (
  public.current_user_can_access('clinica')
  or public.current_user_can_access('pets')
)
with check (
  public.current_user_can_access('clinica')
  or public.current_user_can_access('pets')
);

drop policy if exists "Pet users can manage clinical prescriptions"
on public.clinical_prescriptions;

create policy "Clinic users can manage clinical prescriptions"
on public.clinical_prescriptions for all to authenticated
using (
  public.current_user_can_access('clinica')
  or public.current_user_can_access('pets')
)
with check (
  public.current_user_can_access('clinica')
  or public.current_user_can_access('pets')
);

drop policy if exists "Pet users can manage vaccinations"
on public.pet_vaccinations;

create policy "Clinic users can manage vaccinations"
on public.pet_vaccinations for all to authenticated
using (
  public.current_user_can_access('clinica')
  or public.current_user_can_access('pets')
)
with check (
  public.current_user_can_access('clinica')
  or public.current_user_can_access('pets')
);

commit;
