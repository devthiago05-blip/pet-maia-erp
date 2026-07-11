alter table public.appointments
  add column if not exists observacao text;

comment on column public.appointments.observacao is
  'Observacao operacional do agendamento exibida na agenda e impressao.';
