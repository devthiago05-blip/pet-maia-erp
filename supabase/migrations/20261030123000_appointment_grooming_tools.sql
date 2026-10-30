alter table public.appointments
add column if not exists grooming_tools text[];

comment on column public.appointments.grooming_tools is
'Pentes, lâminas e combinações utilizados na tosa do atendimento.';
