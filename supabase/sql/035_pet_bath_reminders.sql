alter table public.pets
  add column if not exists bath_reminder_interval_days integer,
  add column if not exists bath_reminder_dismissed_until date;

alter table public.pets
  drop constraint if exists pets_bath_reminder_interval_days_check;

alter table public.pets
  add constraint pets_bath_reminder_interval_days_check
  check (
    bath_reminder_interval_days is null
    or bath_reminder_interval_days in (7, 15, 30)
  );

create index if not exists idx_pets_bath_reminder_dismissed_until
  on public.pets (bath_reminder_dismissed_until);
