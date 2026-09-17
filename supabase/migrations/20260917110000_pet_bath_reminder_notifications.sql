create table if not exists public.pet_bath_reminder_notifications (
  id bigserial primary key,
  pet_id bigint not null references public.pets(id) on delete cascade,
  tutor_id bigint references public.tutors(id) on delete set null,
  reminder_level integer not null check (reminder_level in (30, 45, 60)),
  bath_reference_key text not null,
  last_bath_date date,
  days_without_bath integer not null check (days_without_bath >= 0),
  message text not null,
  channel text not null default 'whatsapp'
    check (channel in ('whatsapp', 'manual', 'phone', 'other')),
  notified_at timestamptz not null default now(),
  notified_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint pet_bath_reminder_notifications_unique
    unique (pet_id, reminder_level, bath_reference_key)
);

create index if not exists idx_pet_bath_reminder_notifications_pet
  on public.pet_bath_reminder_notifications (pet_id, notified_at desc);

create index if not exists idx_pet_bath_reminder_notifications_level
  on public.pet_bath_reminder_notifications (reminder_level, notified_at desc);

alter table public.pet_bath_reminder_notifications enable row level security;

drop policy if exists "Agenda users can read bath reminder notifications"
on public.pet_bath_reminder_notifications;
create policy "Agenda users can read bath reminder notifications"
on public.pet_bath_reminder_notifications
for select
to authenticated
using (public.current_user_can_access('agenda'));

drop policy if exists "Agenda users can mark bath reminder notifications"
on public.pet_bath_reminder_notifications;
create policy "Agenda users can mark bath reminder notifications"
on public.pet_bath_reminder_notifications
for insert
to authenticated
with check (public.current_user_can_access('agenda'));

drop policy if exists "Agenda users can unmark bath reminder notifications"
on public.pet_bath_reminder_notifications;
create policy "Agenda users can unmark bath reminder notifications"
on public.pet_bath_reminder_notifications
for delete
to authenticated
using (public.current_user_can_access('agenda'));

revoke all on public.pet_bath_reminder_notifications from anon;
grant select, insert, delete on public.pet_bath_reminder_notifications to authenticated;
grant usage, select on sequence public.pet_bath_reminder_notifications_id_seq to authenticated;
