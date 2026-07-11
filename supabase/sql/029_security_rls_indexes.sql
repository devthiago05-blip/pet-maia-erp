-- 029_security_rls_indexes.sql
-- Reforca RLS, grants de funcoes internas e indices de chaves estrangeiras.

begin;

alter table public.appointment_services enable row level security;

drop policy if exists "Module users can read appointment services" on public.appointment_services;
create policy "Module users can read appointment services"
on public.appointment_services
for select
to authenticated
using (
  public.current_user_can_access('agenda')
  or public.current_user_can_access('financeiro')
  or public.current_user_can_access('recibos')
);

drop policy if exists "Agenda users can insert appointment services" on public.appointment_services;
create policy "Agenda users can insert appointment services"
on public.appointment_services
for insert
to authenticated
with check (public.current_user_can_access('agenda'));

drop policy if exists "Agenda users can update appointment services" on public.appointment_services;
create policy "Agenda users can update appointment services"
on public.appointment_services
for update
to authenticated
using (public.current_user_can_access('agenda'))
with check (public.current_user_can_access('agenda'));

drop policy if exists "Agenda users can delete appointment services" on public.appointment_services;
create policy "Agenda users can delete appointment services"
on public.appointment_services
for delete
to authenticated
using (public.current_user_can_access('agenda'));

revoke all on public.appointment_services from anon;
grant select, insert, update, delete on public.appointment_services to authenticated;

do $$
begin
  if to_regclass('public.appointment_services_id_seq') is not null then
    revoke all on sequence public.appointment_services_id_seq from anon;
    grant usage, select on sequence public.appointment_services_id_seq to authenticated;
  end if;
end $$;

revoke execute on function public.cancel_pos_sale(bigint) from public, anon;
grant execute on function public.cancel_pos_sale(bigint) to authenticated;

revoke execute on function public.convert_pos_quote(bigint, text) from public, anon;
grant execute on function public.convert_pos_quote(bigint, text) to authenticated;

revoke execute on function public.create_pos_quote(bigint, text, date, jsonb) from public, anon;
grant execute on function public.create_pos_quote(bigint, text, date, jsonb) to authenticated;

revoke execute on function public.create_pos_sale(bigint, text, text, jsonb) from public, anon;
grant execute on function public.create_pos_sale(bigint, text, text, jsonb) to authenticated;

revoke execute on function public.create_product_purchase(
  bigint,
  text,
  date,
  date,
  text,
  text,
  jsonb
) from public, anon;
grant execute on function public.create_product_purchase(
  bigint,
  text,
  date,
  date,
  text,
  text,
  jsonb
) to authenticated;

revoke execute on function public.delete_grooming_supply_movement(bigint) from public, anon;
grant execute on function public.delete_grooming_supply_movement(bigint) to authenticated;

revoke execute on function public.sync_grooming_supply_stock() from public, anon;
grant execute on function public.sync_grooming_supply_stock() to authenticated;

revoke execute on function public.current_user_can_access(text) from public, anon;
grant execute on function public.current_user_can_access(text) to authenticated;

revoke execute on function public.current_user_is_admin() from public, anon;
grant execute on function public.current_user_is_admin() to authenticated;

revoke execute on function public.create_default_user_permissions(uuid) from public, anon, authenticated;
revoke execute on function public.handle_new_auth_user() from public, anon, authenticated;

-- A funcao get_shared_prescription permanece acessivel para anon porque sustenta
-- a rota publica /receita/[token]. O acesso aos dados segue restrito ao token.
revoke execute on function public.get_shared_prescription(uuid) from public;
grant execute on function public.get_shared_prescription(uuid) to anon, authenticated;

create index if not exists idx_appointment_services_appointment_id
on public.appointment_services(appointment_id);

create index if not exists idx_appointments_pet_id
on public.appointments(pet_id);

create index if not exists idx_pets_tutor_id
on public.pets(tutor_id);

create index if not exists idx_clinical_attachments_uploaded_by
on public.clinical_attachments(uploaded_by);

create index if not exists idx_clinical_audit_logs_changed_by
on public.clinical_audit_logs(changed_by);

create index if not exists idx_clinical_exams_clinical_record_id
on public.clinical_exams(clinical_record_id);

create index if not exists idx_clinical_prescription_documents_professional_id
on public.clinical_prescription_documents(professional_id);

create index if not exists idx_clinical_prescription_reissues_reissued_by
on public.clinical_prescription_reissues(reissued_by);

create index if not exists idx_clinical_records_professional_id
on public.clinical_records(professional_id);

create index if not exists idx_groomer_daily_payments_financial_entry_id
on public.groomer_daily_payments(financial_entry_id);

create index if not exists idx_grooming_supply_movements_financial_entry_id
on public.grooming_supply_movements(financial_entry_id);

create index if not exists idx_medication_catalog_created_by
on public.medication_catalog(created_by);

create index if not exists idx_medication_dosage_templates_created_by
on public.medication_dosage_templates(created_by);

create index if not exists idx_pos_quote_items_product_id
on public.pos_quote_items(product_id);

create index if not exists idx_pos_quote_items_quote_id
on public.pos_quote_items(quote_id);

create index if not exists idx_pos_quotes_tutor_id
on public.pos_quotes(tutor_id);

create index if not exists idx_pos_sale_items_product_id
on public.pos_sale_items(product_id);

create index if not exists idx_pos_sale_items_sale_id
on public.pos_sale_items(sale_id);

create index if not exists idx_pos_sales_tutor_id
on public.pos_sales(tutor_id);

create index if not exists idx_product_purchase_items_product_id
on public.product_purchase_items(product_id);

create index if not exists idx_product_purchase_items_purchase_id
on public.product_purchase_items(purchase_id);

create index if not exists idx_product_purchases_financial_entry_id
on public.product_purchases(financial_entry_id);

create index if not exists idx_product_purchases_supplier_id
on public.product_purchases(supplier_id);

create index if not exists idx_products_category_id
on public.products(category_id);

commit;
