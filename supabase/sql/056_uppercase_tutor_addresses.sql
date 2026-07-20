create or replace function public.normalize_tutor_address_uppercase() returns trigger
language plpgsql security invoker set search_path = public, pg_temp as $$
begin
  new.endereco := case when new.endereco is null then null else upper(trim(new.endereco)) end;
  return new;
end; $$;

drop trigger if exists normalize_tutor_address_uppercase_trigger on public.tutors;
create trigger normalize_tutor_address_uppercase_trigger before insert or update of endereco on public.tutors
for each row execute function public.normalize_tutor_address_uppercase();

update public.tutors set endereco = upper(trim(endereco)) where endereco is not null and endereco <> upper(trim(endereco));

revoke all on function public.normalize_tutor_address_uppercase() from public, anon, authenticated;
