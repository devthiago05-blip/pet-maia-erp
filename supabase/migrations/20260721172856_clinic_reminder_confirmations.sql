alter table public.clinical_records
  add column if not exists reminder_status text not null default 'Pendente'
    check (reminder_status in ('Pendente', 'Confirmado')),
  add column if not exists reminder_confirmed_at timestamptz;

alter table public.pet_vaccinations
  add column if not exists reminder_status text not null default 'Pendente'
    check (reminder_status in ('Pendente', 'Confirmado')),
  add column if not exists reminder_confirmed_at timestamptz;
