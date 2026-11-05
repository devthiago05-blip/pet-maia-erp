alter table public.tutors
add column if not exists ativo boolean not null default true;

alter table public.tutors
add column if not exists inactivated_at timestamp with time zone;

alter table public.tutors
add column if not exists inactivation_reason text;

comment on column public.tutors.ativo is
'Indica se o tutor está ativo nas rotinas operacionais do ERP.';

comment on column public.tutors.inactivated_at is
'Data em que o tutor foi inativado, sem exclusão do cadastro ou histórico.';

comment on column public.tutors.inactivation_reason is
'Motivo da inativação do tutor.';

create index if not exists idx_tutors_ativo_nome
on public.tutors (ativo, nome);

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.sync_tutor_activity_from_pets()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_tutor_id bigint;
  pet_total integer;
  active_pet_total integer;
begin
  if auth.uid() is not null
    and not public.current_user_can_access('pets') then
    raise exception 'Usuário sem permissão para atualizar pets';
  end if;

  for selected_tutor_id in
    select distinct tutor_id
    from (
      select case when tg_op <> 'DELETE' then new.tutor_id end as tutor_id
      union all
      select case when tg_op <> 'INSERT' then old.tutor_id end as tutor_id
    ) as affected_tutors
    where tutor_id is not null
  loop
    select
      count(*),
      count(*) filter (where pet.ativo is true)
    into pet_total, active_pet_total
    from public.pets as pet
    where pet.tutor_id = selected_tutor_id;

    if pet_total > 0 and active_pet_total = 0 then
      update public.tutors
      set
        ativo = false,
        inactivated_at = coalesce(inactivated_at, now()),
        inactivation_reason = 'Todos os pets estão inativos'
      where id = selected_tutor_id
        and (
          ativo is true
          or inactivation_reason is distinct from 'Todos os pets estão inativos'
        );
    elsif active_pet_total > 0 then
      update public.tutors
      set
        ativo = true,
        inactivated_at = null,
        inactivation_reason = null
      where id = selected_tutor_id
        and ativo is false
        and inactivation_reason = 'Todos os pets estão inativos';
    end if;
  end loop;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

revoke all on function private.sync_tutor_activity_from_pets() from public;

drop trigger if exists sync_tutor_activity_from_pets on public.pets;
create trigger sync_tutor_activity_from_pets
after insert or delete or update of ativo, tutor_id on public.pets
for each row
execute function private.sync_tutor_activity_from_pets();

update public.tutors as tutor
set
  ativo = false,
  inactivated_at = now(),
  inactivation_reason = 'Todos os pets estão inativos'
where tutor.ativo is true
  and exists (
    select 1
    from public.pets as pet
    where pet.tutor_id = tutor.id
  )
  and not exists (
    select 1
    from public.pets as pet
    where pet.tutor_id = tutor.id
      and pet.ativo is true
  );

select cron.unschedule(jobid)
from cron.job
where jobname = 'sync-tutors-with-pet-activity';

select cron.schedule(
  'sync-tutors-with-pet-activity',
  '35 6 * * *',
  $cron$
    update public.tutors as tutor
    set
      ativo = false,
      inactivated_at = coalesce(tutor.inactivated_at, now()),
      inactivation_reason = 'Todos os pets estão inativos'
    where exists (
      select 1
      from public.pets as pet
      where pet.tutor_id = tutor.id
    )
      and not exists (
        select 1
        from public.pets as pet
        where pet.tutor_id = tutor.id
          and pet.ativo is true
      )
      and (
        tutor.ativo is true
        or tutor.inactivation_reason is distinct from 'Todos os pets estão inativos'
      );

    update public.tutors as tutor
    set
      ativo = true,
      inactivated_at = null,
      inactivation_reason = null
    where tutor.ativo is false
      and tutor.inactivation_reason = 'Todos os pets estão inativos'
      and exists (
        select 1
        from public.pets as pet
        where pet.tutor_id = tutor.id
          and pet.ativo is true
      );
  $cron$
);
