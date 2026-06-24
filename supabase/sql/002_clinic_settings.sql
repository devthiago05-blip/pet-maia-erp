begin;

create table if not exists public.clinic_settings (
  id smallint primary key default 1 check (id = 1),
  nome text not null default 'PET MAIA ERP',
  razao_social text,
  cnpj text,
  telefone text,
  endereco text,
  pix_key text,
  pix_recipient_name text,
  pix_city text,
  updated_at timestamptz not null default now()
);

insert into public.clinic_settings (id)
values (1)
on conflict (id) do nothing;

alter table public.clinic_settings enable row level security;

drop policy if exists "Authenticated users can read clinic settings"
on public.clinic_settings;

create policy "Authenticated users can read clinic settings"
on public.clinic_settings
for select
to authenticated
using (true);

drop policy if exists "Administrators can update clinic settings"
on public.clinic_settings;

create policy "Administrators can update clinic settings"
on public.clinic_settings
for update
to authenticated
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

revoke all on public.clinic_settings from anon;
grant select, update on public.clinic_settings to authenticated;

commit;
