-- 024_legacy_rls_audit.sql
-- Auditoria das tabelas principais antes de ativar/ajustar RLS.

select
  schemaname,
  tablename,
  rowsecurity as rls_enabled
from pg_tables
where schemaname = 'public'
  and tablename in (
    'tutors',
    'pets',
    'appointments',
    'services',
    'financial_entries',
    'products',
    'product_categories',
    'pos_quotes',
    'pos_quote_items',
    'pos_sales',
    'pos_sale_items',
    'suppliers',
    'product_purchases',
    'product_purchase_items'
  )
order by tablename;

select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in (
    'tutors',
    'pets',
    'appointments',
    'services',
    'financial_entries',
    'products',
    'product_categories',
    'pos_quotes',
    'pos_quote_items',
    'pos_sales',
    'pos_sale_items',
    'suppliers',
    'product_purchases',
    'product_purchase_items'
  )
order by tablename, policyname;
