begin;

do $$
declare
  policy_record record;
begin
  if to_regclass('public.tutors') is not null then
    execute 'alter table public.tutors enable row level security';

    for policy_record in
      select policyname
      from pg_policies
      where schemaname = 'public'
        and tablename = 'tutors'
    loop
      execute format('drop policy if exists %I on public.tutors', policy_record.policyname);
    end loop;

    execute '
      create policy "Module users can read tutors"
      on public.tutors for select to authenticated
      using (
        public.current_user_can_access(''tutores'')
        or public.current_user_can_access(''pets'')
        or public.current_user_can_access(''agenda'')
        or public.current_user_can_access(''clinica'')
        or public.current_user_can_access(''financeiro'')
        or public.current_user_can_access(''crm'')
        or public.current_user_can_access(''dashboard'')
      )
    ';

    execute '
      create policy "Tutor users can insert tutors"
      on public.tutors for insert to authenticated
      with check (public.current_user_can_access(''tutores''))
    ';

    execute '
      create policy "Tutor users can update tutors"
      on public.tutors for update to authenticated
      using (public.current_user_can_access(''tutores''))
      with check (public.current_user_can_access(''tutores''))
    ';

    execute '
      create policy "Tutor users can delete tutors"
      on public.tutors for delete to authenticated
      using (public.current_user_can_access(''tutores''))
    ';
  end if;
end $$;

do $$
declare
  policy_record record;
begin
  if to_regclass('public.pets') is not null then
    execute 'alter table public.pets enable row level security';

    for policy_record in
      select policyname
      from pg_policies
      where schemaname = 'public'
        and tablename = 'pets'
    loop
      execute format('drop policy if exists %I on public.pets', policy_record.policyname);
    end loop;

    execute '
      create policy "Module users can read pets"
      on public.pets for select to authenticated
      using (
        public.current_user_can_access(''pets'')
        or public.current_user_can_access(''tutores'')
        or public.current_user_can_access(''agenda'')
        or public.current_user_can_access(''clinica'')
        or public.current_user_can_access(''dashboard'')
      )
    ';

    execute '
      create policy "Pet users can insert pets"
      on public.pets for insert to authenticated
      with check (public.current_user_can_access(''pets''))
    ';

    execute '
      create policy "Pet users can update pets"
      on public.pets for update to authenticated
      using (public.current_user_can_access(''pets''))
      with check (public.current_user_can_access(''pets''))
    ';

    execute '
      create policy "Pet users can delete pets"
      on public.pets for delete to authenticated
      using (public.current_user_can_access(''pets''))
    ';
  end if;
end $$;

do $$
declare
  policy_record record;
begin
  if to_regclass('public.appointments') is not null then
    execute 'alter table public.appointments enable row level security';

    for policy_record in
      select policyname
      from pg_policies
      where schemaname = 'public'
        and tablename = 'appointments'
    loop
      execute format('drop policy if exists %I on public.appointments', policy_record.policyname);
    end loop;

    execute '
      create policy "Module users can read appointments"
      on public.appointments for select to authenticated
      using (
        public.current_user_can_access(''agenda'')
        or public.current_user_can_access(''dashboard'')
        or public.current_user_can_access(''pets'')
        or public.current_user_can_access(''clinica'')
      )
    ';

    execute '
      create policy "Agenda users can insert appointments"
      on public.appointments for insert to authenticated
      with check (public.current_user_can_access(''agenda''))
    ';

    execute '
      create policy "Agenda users can update appointments"
      on public.appointments for update to authenticated
      using (public.current_user_can_access(''agenda''))
      with check (public.current_user_can_access(''agenda''))
    ';

    execute '
      create policy "Agenda users can delete appointments"
      on public.appointments for delete to authenticated
      using (public.current_user_can_access(''agenda''))
    ';
  end if;
end $$;

do $$
declare
  policy_record record;
begin
  if to_regclass('public.services') is not null then
    execute 'alter table public.services enable row level security';

    for policy_record in
      select policyname
      from pg_policies
      where schemaname = 'public'
        and tablename = 'services'
    loop
      execute format('drop policy if exists %I on public.services', policy_record.policyname);
    end loop;

    execute '
      create policy "Module users can read services"
      on public.services for select to authenticated
      using (
        public.current_user_can_access(''servicos'')
        or public.current_user_can_access(''agenda'')
        or public.current_user_can_access(''dashboard'')
      )
    ';

    execute '
      create policy "Service users can insert services"
      on public.services for insert to authenticated
      with check (public.current_user_can_access(''servicos''))
    ';

    execute '
      create policy "Service users can update services"
      on public.services for update to authenticated
      using (public.current_user_can_access(''servicos''))
      with check (public.current_user_can_access(''servicos''))
    ';

    execute '
      create policy "Service users can delete services"
      on public.services for delete to authenticated
      using (public.current_user_can_access(''servicos''))
    ';
  end if;
end $$;

do $$
declare
  policy_record record;
begin
  if to_regclass('public.financial_entries') is not null then
    execute 'alter table public.financial_entries enable row level security';

    for policy_record in
      select policyname
      from pg_policies
      where schemaname = 'public'
        and tablename = 'financial_entries'
    loop
      execute format('drop policy if exists %I on public.financial_entries', policy_record.policyname);
    end loop;

    execute '
      create policy "Module users can read financial entries"
      on public.financial_entries for select to authenticated
      using (
        public.current_user_can_access(''financeiro'')
        or public.current_user_can_access(''dashboard'')
      )
    ';

    execute '
      create policy "Finance users can insert financial entries"
      on public.financial_entries for insert to authenticated
      with check (public.current_user_can_access(''financeiro''))
    ';

    execute '
      create policy "Finance users can update financial entries"
      on public.financial_entries for update to authenticated
      using (public.current_user_can_access(''financeiro''))
      with check (public.current_user_can_access(''financeiro''))
    ';

    execute '
      create policy "Finance users can delete financial entries"
      on public.financial_entries for delete to authenticated
      using (public.current_user_can_access(''financeiro''))
    ';
  end if;
end $$;

grant select, insert, update, delete
on public.tutors,
   public.pets,
   public.appointments,
   public.services,
   public.financial_entries
to authenticated;

grant usage, select on all sequences in schema public to authenticated;

commit;