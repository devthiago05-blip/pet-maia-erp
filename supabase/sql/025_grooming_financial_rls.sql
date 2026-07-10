-- 025_grooming_financial_rls.sql
-- Permite que o módulo de Serviços crie despesas financeiras geradas pelos insumos do banho e tosa.

alter table if exists public.financial_entries enable row level security;

drop policy if exists "Service users can insert grooming financial entries" on public.financial_entries;
drop policy if exists "Service users can read grooming financial entries" on public.financial_entries;

create policy "Service users can insert grooming financial entries"
on public.financial_entries
for insert
to authenticated
with check (
  current_user_can_access('servicos')
  and tipo = 'Despesa'
  and status_pagamento = 'Pendente'
  and origem in ('grooming_supply', 'groomer_daily_payment')
);

create policy "Service users can read grooming financial entries"
on public.financial_entries
for select
to authenticated
using (
  current_user_can_access('servicos')
  and origem in ('grooming_supply', 'groomer_daily_payment')
);

select
  policyname,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'financial_entries'
  and policyname in (
    'Service users can insert grooming financial entries',
    'Service users can read grooming financial entries'
  )
order by policyname;
