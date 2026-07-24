alter table public.tutors
  add column if not exists cpf text;

alter table public.tutors
  drop constraint if exists tutors_cpf_digits_check;

alter table public.tutors
  add constraint tutors_cpf_digits_check
  check (cpf is null or cpf ~ '^[0-9]{11}$');

create index if not exists idx_tutors_cpf
  on public.tutors(cpf)
  where cpf is not null;
