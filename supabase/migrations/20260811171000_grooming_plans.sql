create table if not exists public.grooming_plans (
  id bigserial primary key,
  name text not null,
  monthly_price numeric(12, 2) not null default 0
    check (monthly_price >= 0),
  baths_per_month integer not null default 0
    check (baths_per_month >= 0),
  free_benefits text[] not null default '{}'::text[],
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists grooming_plans_name_unique
on public.grooming_plans (lower(trim(name)));

create index if not exists grooming_plans_active_name_idx
on public.grooming_plans (active, name);

create or replace function public.set_grooming_plans_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_grooming_plans_updated_at_trigger
on public.grooming_plans;

create trigger set_grooming_plans_updated_at_trigger
before update on public.grooming_plans
for each row
execute function public.set_grooming_plans_updated_at();

alter table public.grooming_plans enable row level security;

drop policy if exists "Grooming users can read plans"
on public.grooming_plans;

create policy "Grooming users can read plans"
on public.grooming_plans for select to authenticated
using (
  public.current_user_can_access('servicos')
  or public.current_user_can_access('agenda')
  or public.current_user_can_access('dashboard')
  or public.current_user_can_access('financeiro')
);

drop policy if exists "Grooming users can insert plans"
on public.grooming_plans;

create policy "Grooming users can insert plans"
on public.grooming_plans for insert to authenticated
with check (public.current_user_can_access('servicos'));

drop policy if exists "Grooming users can update plans"
on public.grooming_plans;

create policy "Grooming users can update plans"
on public.grooming_plans for update to authenticated
using (public.current_user_can_access('servicos'))
with check (public.current_user_can_access('servicos'));

drop policy if exists "Grooming users can delete plans"
on public.grooming_plans;

create policy "Grooming users can delete plans"
on public.grooming_plans for delete to authenticated
using (public.current_user_can_access('servicos'));

grant select, insert, update, delete on public.grooming_plans to authenticated;
grant usage, select on sequence public.grooming_plans_id_seq to authenticated;

revoke all on function public.set_grooming_plans_updated_at()
from public, anon, authenticated;
