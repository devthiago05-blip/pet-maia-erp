create or replace function public.normalize_product_name_uppercase()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.nome := upper(trim(new.nome));
  if new.name is not null then
    new.name := upper(trim(new.name));
  end if;
  return new;
end;
$$;

drop trigger if exists normalize_product_name_uppercase on public.products;
create trigger normalize_product_name_uppercase
before insert or update of nome, name on public.products
for each row execute function public.normalize_product_name_uppercase();

update public.products
set nome = upper(trim(nome)),
    name = case when name is null then null else upper(trim(name)) end
where nome is distinct from upper(trim(nome))
   or (name is not null and name is distinct from upper(trim(name)));
