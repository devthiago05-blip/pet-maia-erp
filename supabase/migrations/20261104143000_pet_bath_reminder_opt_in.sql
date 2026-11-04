alter table public.pets
add column if not exists bath_reminder_enabled boolean not null default true;

comment on column public.pets.bath_reminder_enabled is
'Define se o pet participa dos lembretes recorrentes de banho.';

with last_baths as (
  select
    pet_id,
    max(data::date) as last_bath_date
  from public.appointments
  where status = 'Finalizado'
    and servico ilike '%banho%'
    and pet_id is not null
    and data ~ '^\d{4}-\d{2}-\d{2}$'
  group by pet_id
)
update public.pets as pet
set
  bath_reminder_enabled = false,
  bath_reminder_dismissed_until = null
from last_baths
where last_baths.pet_id = pet.id
  and coalesce(last_baths.last_bath_date, pet.created_at::date) < current_date - 100;

update public.pets as pet
set
  bath_reminder_enabled = false,
  bath_reminder_dismissed_until = null
where not exists (
  select 1
  from public.appointments as appointment
  where appointment.pet_id = pet.id
    and appointment.status = 'Finalizado'
    and appointment.servico ilike '%banho%'
    and appointment.data ~ '^\d{4}-\d{2}-\d{2}$'
)
and pet.created_at::date < current_date - 100;

create extension if not exists pg_cron with schema pg_catalog;

grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

select cron.unschedule(jobid)
from cron.job
where jobname = 'disable-stale-pet-bath-reminders';

select cron.schedule(
  'disable-stale-pet-bath-reminders',
  '15 6 * * *',
  $cron$
    with last_baths as (
      select
        pet_id,
        max(data::date) as last_bath_date
      from public.appointments
      where status = 'Finalizado'
        and servico ilike '%banho%'
        and pet_id is not null
        and data ~ '^\d{4}-\d{2}-\d{2}$'
      group by pet_id
    )
    update public.pets as pet
    set
      bath_reminder_enabled = false,
      bath_reminder_dismissed_until = null
    where pet.bath_reminder_enabled is true
      and coalesce(
        (
          select last_baths.last_bath_date
          from last_baths
          where last_baths.pet_id = pet.id
        ),
        pet.created_at::date
      ) < current_date - 100;
  $cron$
);
