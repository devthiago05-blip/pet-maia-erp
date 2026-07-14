do $migration$
declare
  function_sql text;
begin
  select pg_get_functiondef('public.create_public_site_appointment(jsonb)'::regprocedure)
  into function_sql;

  if function_sql is null then
    raise notice 'Function public.create_public_site_appointment(jsonb) not found.';
    return;
  end if;

  function_sql := replace(
    function_sql,
    $$and appointment.status = 'Agendado'$$,
    $$and appointment.status in ('Pendente', 'Agendado')$$
  );

  function_sql := replace(
    function_sql,
    $$values (selected_pet_id, service_names, requested_date_text, requested_time, 'Agendado', observation)$$,
    $$values (selected_pet_id, service_names, requested_date_text, requested_time, 'Pendente', observation)$$
  );

  execute function_sql;
end $migration$;
