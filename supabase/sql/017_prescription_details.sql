begin;

alter table public.clinical_prescriptions
add column if not exists item_type text not null default 'industrializado'
check (item_type in ('industrializado', 'manipulado'));

alter table public.clinical_prescriptions
add column if not exists prescription_type text not null default 'simples'
check (prescription_type in ('simples', 'controle_especial', 'antimicrobiano'));

alter table public.clinical_prescriptions
add column if not exists pharmacy_type text
check (pharmacy_type in ('veterinaria', 'humana', 'manipulacao'));

alter table public.clinical_prescriptions
add column if not exists administration_route text;

alter table public.clinical_prescriptions
add column if not exists quantity numeric(10, 2)
check (quantity is null or quantity > 0);

alter table public.clinical_prescriptions
add column if not exists quantity_unit text;

alter table public.clinical_prescriptions
add column if not exists pharmaceutical_form text;

alter table public.clinical_prescriptions
add column if not exists composition text;

comment on column public.clinical_prescriptions.item_type is
'Tipo do item prescrito: industrializado ou manipulado.';

comment on column public.clinical_prescriptions.prescription_type is
'Classificacao documental da receita.';

comment on column public.clinical_prescriptions.composition is
'Composicao textual da formula manipulada.';

commit;

select
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'clinical_prescriptions'
  and column_name in (
    'item_type',
    'prescription_type',
    'pharmacy_type',
    'administration_route',
    'quantity',
    'quantity_unit',
    'pharmaceutical_form',
    'composition'
  )
order by ordinal_position;
