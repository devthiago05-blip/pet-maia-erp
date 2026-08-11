create table if not exists public.grooming_plan_subscriptions (
  id bigserial primary key,
  plan_id bigint not null references public.grooming_plans(id) on delete restrict,
  tutor_id bigint references public.tutors(id) on delete set null,
  pet_id bigint not null references public.pets(id) on delete cascade,
  start_date date not null default current_date,
  end_date date,
  next_billing_date date,
  status text not null default 'Ativo'
    check (status in ('Ativo', 'Pausado', 'Cancelado', 'Encerrado')),
  monthly_price numeric(12, 2) not null default 0
    check (monthly_price >= 0),
  baths_per_month integer not null default 0
    check (baths_per_month >= 0),
  free_benefits text[] not null default '{}'::text[],
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date is null or end_date >= start_date),
  check (next_billing_date is null or next_billing_date >= start_date)
);

create unique index if not exists grooming_plan_subscriptions_active_pet_unique
on public.grooming_plan_subscriptions (pet_id)
where status = 'Ativo';

create index if not exists grooming_plan_subscriptions_pet_status_idx
on public.grooming_plan_subscriptions (pet_id, status);

create index if not exists grooming_plan_subscriptions_next_billing_idx
on public.grooming_plan_subscriptions (next_billing_date)
where status = 'Ativo';

create table if not exists public.grooming_plan_usage (
  id bigserial primary key,
  subscription_id bigint not null references public.grooming_plan_subscriptions(id) on delete cascade,
  appointment_id bigint references public.appointments(id) on delete set null,
  usage_date date not null default current_date,
  usage_type text not null check (usage_type in ('Banho', 'Benefício')),
  benefit_name text,
  quantity integer not null default 1 check (quantity > 0),
  notes text,
  created_by uuid references public.user_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    usage_type = 'Banho'
    or (
      usage_type = 'Benefício'
      and nullif(trim(benefit_name), '') is not null
    )
  )
);

create index if not exists grooming_plan_usage_subscription_date_idx
on public.grooming_plan_usage (subscription_id, usage_date desc);

create index if not exists grooming_plan_usage_appointment_idx
on public.grooming_plan_usage (appointment_id)
where appointment_id is not null;

create or replace function public.set_grooming_plan_tracking_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_grooming_plan_subscriptions_updated_at_trigger
on public.grooming_plan_subscriptions;

create trigger set_grooming_plan_subscriptions_updated_at_trigger
before update on public.grooming_plan_subscriptions
for each row
execute function public.set_grooming_plan_tracking_updated_at();

drop trigger if exists set_grooming_plan_usage_updated_at_trigger
on public.grooming_plan_usage;

create trigger set_grooming_plan_usage_updated_at_trigger
before update on public.grooming_plan_usage
for each row
execute function public.set_grooming_plan_tracking_updated_at();

alter table public.grooming_plan_subscriptions enable row level security;
alter table public.grooming_plan_usage enable row level security;

drop policy if exists "Grooming users can read plan subscriptions"
on public.grooming_plan_subscriptions;

create policy "Grooming users can read plan subscriptions"
on public.grooming_plan_subscriptions for select to authenticated
using (
  public.current_user_can_access('servicos')
  or public.current_user_can_access('agenda')
  or public.current_user_can_access('dashboard')
  or public.current_user_can_access('financeiro')
);

drop policy if exists "Grooming users can manage plan subscriptions"
on public.grooming_plan_subscriptions;

create policy "Grooming users can manage plan subscriptions"
on public.grooming_plan_subscriptions for all to authenticated
using (public.current_user_can_access('servicos'))
with check (public.current_user_can_access('servicos'));

drop policy if exists "Grooming users can read plan usage"
on public.grooming_plan_usage;

create policy "Grooming users can read plan usage"
on public.grooming_plan_usage for select to authenticated
using (
  public.current_user_can_access('servicos')
  or public.current_user_can_access('agenda')
  or public.current_user_can_access('dashboard')
  or public.current_user_can_access('financeiro')
);

drop policy if exists "Grooming users can manage plan usage"
on public.grooming_plan_usage;

create policy "Grooming users can manage plan usage"
on public.grooming_plan_usage for all to authenticated
using (
  public.current_user_can_access('servicos')
  or public.current_user_can_access('agenda')
)
with check (
  public.current_user_can_access('servicos')
  or public.current_user_can_access('agenda')
);

grant select, insert, update, delete
on public.grooming_plan_subscriptions,
   public.grooming_plan_usage
to authenticated;

grant usage, select
on sequence public.grooming_plan_subscriptions_id_seq,
            public.grooming_plan_usage_id_seq
to authenticated;

revoke all on function public.set_grooming_plan_tracking_updated_at()
from public, anon, authenticated;
