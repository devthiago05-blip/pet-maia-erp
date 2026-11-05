alter table public.pets
add column if not exists ativo boolean not null default true;

alter table public.pets
add column if not exists inactivated_at timestamp with time zone;

alter table public.pets
add column if not exists inactivation_reason text;

comment on column public.pets.ativo is
'Indica se o pet está ativo nas rotinas operacionais do ERP.';

comment on column public.pets.inactivated_at is
'Data em que o cadastro do pet foi inativado, sem exclusão do histórico.';

comment on column public.pets.inactivation_reason is
'Motivo da inativação do cadastro do pet.';

create index if not exists idx_pets_ativo_nome
on public.pets (ativo, nome);

create or replace function public.sync_pet_inactivation_metadata()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.ativo is false and old.ativo is true then
    new.inactivated_at := coalesce(new.inactivated_at, now());
    new.inactivation_reason := coalesce(
      nullif(trim(new.inactivation_reason), ''),
      'Inativado manualmente'
    );
  elsif new.ativo is true and old.ativo is false then
    new.inactivated_at := null;
    new.inactivation_reason := null;
  end if;

  return new;
end;
$$;

revoke all on function public.sync_pet_inactivation_metadata() from public;
grant execute on function public.sync_pet_inactivation_metadata() to authenticated;

drop trigger if exists sync_pet_inactivation_metadata on public.pets;
create trigger sync_pet_inactivation_metadata
before update of ativo on public.pets
for each row
execute function public.sync_pet_inactivation_metadata();

with pet_activity as (
  select
    pet.id,
    coalesce(
      max(appointment.data::date) filter (
        where appointment.status = 'Finalizado'
          and appointment.data ~ '^\d{4}-\d{2}-\d{2}$'
      ),
      pet.created_at::date
    ) as last_activity_date
  from public.pets as pet
  left join public.appointments as appointment
    on appointment.pet_id = pet.id
  group by pet.id, pet.created_at
)
update public.pets as pet
set
  ativo = false,
  inactivated_at = now(),
  inactivation_reason = 'Sem atendimento há mais de 120 dias',
  bath_reminder_enabled = false,
  bath_reminder_dismissed_until = null
from pet_activity
where pet.id = pet_activity.id
  and pet.ativo is true
  and pet_activity.last_activity_date < current_date - 120
  and not exists (
    select 1
    from public.appointments as future_appointment
    where future_appointment.pet_id = pet.id
      and future_appointment.data ~ '^\d{4}-\d{2}-\d{2}$'
      and future_appointment.data::date >= current_date
      and coalesce(future_appointment.status, 'Agendado') not in (
        'Finalizado',
        'Cancelado'
      )
  );

select cron.unschedule(jobid)
from cron.job
where jobname = 'inactivate-pets-without-service-120-days';

select cron.schedule(
  'inactivate-pets-without-service-120-days',
  '30 6 * * *',
  $cron$
    with pet_activity as (
      select
        pet.id,
        coalesce(
          max(appointment.data::date) filter (
            where appointment.status = 'Finalizado'
              and appointment.data ~ '^\d{4}-\d{2}-\d{2}$'
          ),
          pet.created_at::date
        ) as last_activity_date
      from public.pets as pet
      left join public.appointments as appointment
        on appointment.pet_id = pet.id
      where pet.ativo is true
      group by pet.id, pet.created_at
    )
    update public.pets as pet
    set
      ativo = false,
      inactivated_at = now(),
      inactivation_reason = 'Sem atendimento há mais de 120 dias',
      bath_reminder_enabled = false,
      bath_reminder_dismissed_until = null
    from pet_activity
    where pet.id = pet_activity.id
      and pet_activity.last_activity_date < current_date - 120
      and not exists (
        select 1
        from public.appointments as future_appointment
        where future_appointment.pet_id = pet.id
          and future_appointment.data ~ '^\d{4}-\d{2}-\d{2}$'
          and future_appointment.data::date >= current_date
          and coalesce(future_appointment.status, 'Agendado') not in (
            'Finalizado',
            'Cancelado'
          )
      );
  $cron$
);
