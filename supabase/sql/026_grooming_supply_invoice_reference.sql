-- 026_grooming_supply_invoice_reference.sql
-- Identificação de nota/lote nas movimentações de insumos do banho e tosa.

alter table if exists public.grooming_supply_movements
  add column if not exists document_number text;

alter table if exists public.grooming_supply_movements
  add column if not exists purchase_group_id uuid;

create index if not exists idx_grooming_supply_movements_document_number
  on public.grooming_supply_movements(document_number);

create index if not exists idx_grooming_supply_movements_purchase_group_id
  on public.grooming_supply_movements(purchase_group_id);

select
  column_name,
  data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'grooming_supply_movements'
  and column_name in ('document_number', 'purchase_group_id')
order by column_name;
