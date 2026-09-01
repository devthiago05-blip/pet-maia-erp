create table public.nfce_number_sequences (
  environment text not null check (environment in ('mock', 'homologacao', 'producao')),
  series integer not null check (series between 1 and 999),
  next_number bigint not null check (next_number > 0),
  updated_at timestamptz not null default now(),
  primary key (environment, series)
);

alter table public.clinic_settings
  add column if not exists nome_fantasia text,
  add column if not exists municipio text,
  add column if not exists cep text,
  add column if not exists endereco_numero text,
  add column if not exists bairro text,
  add column if not exists modelo_fiscal integer not null default 65
    check (modelo_fiscal = 65);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('fiscal-xml', 'fiscal-xml', false, 10485760, array['application/xml', 'text/xml']),
  ('fiscal-danfe', 'fiscal-danfe', false, 10485760, array['application/pdf'])
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create table public.nfce_documents (
  id uuid primary key default gen_random_uuid(),
  sale_id bigint references public.pos_sales(id) on delete set null,
  environment text not null check (environment in ('mock', 'homologacao', 'producao')),
  provider text not null check (provider in ('mock', 'sefaz')),
  is_fiscal_valid boolean not null default false,
  number bigint not null check (number > 0),
  series integer not null check (series between 1 and 999),
  access_key text check (access_key is null or access_key ~ '^[0-9]{44}$'),
  status text not null default 'draft' check (status in (
    'draft', 'validated', 'signed', 'pending', 'authorized', 'rejected',
    'contingency', 'cancelled', 'inutilized'
  )),
  xml text,
  signed_xml text,
  xml_path text,
  danfe_path text,
  authorized_xml_path text,
  sefaz_protocol text,
  sefaz_status_code integer,
  sefaz_message text,
  total numeric(14,2) not null check (total >= 0),
  subtotal numeric(14,2) not null default 0 check (subtotal >= 0),
  discount_amount numeric(14,2) not null default 0 check (discount_amount >= 0),
  surcharge_amount numeric(14,2) not null default 0 check (surcharge_amount >= 0),
  change_amount numeric(14,2) not null default 0 check (change_amount >= 0),
  customer_cpf text check (customer_cpf is null or customer_cpf ~ '^[0-9]{11}$'),
  customer_name text,
  contingency_reason text,
  issued_at timestamptz,
  authorized_at timestamptz,
  created_by uuid references public.user_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (environment, series, number),
  unique (environment, access_key),
  check (environment <> 'producao' or provider = 'sefaz'),
  check (environment <> 'producao' or is_fiscal_valid)
);

create table public.fiscal_product_profiles (
  id uuid primary key default gen_random_uuid(),
  product_id bigint not null unique references public.products(id) on delete cascade,
  gtin text,
  ncm text,
  cest text,
  cfop text,
  cst_icms text,
  csosn text,
  origin text,
  commercial_unit text,
  tax_unit text,
  icms_rate numeric(7,4),
  icms_base_mode text,
  icms_base_reduction numeric(7,4),
  pis_cst text,
  pis_rate numeric(7,4),
  cofins_cst text,
  cofins_rate numeric(7,4),
  ipi_cst text,
  ipi_rate numeric(7,4),
  fiscal_benefit_code text,
  anp_code text,
  additional_info text,
  tax_status text not null default 'incomplete'
    check (tax_status in ('complete', 'incomplete', 'review')),
  accountant_validated boolean not null default false,
  reviewed_by uuid references public.user_profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  sale_id bigint references public.pos_sales(id) on delete set null,
  nfce_id uuid references public.nfce_documents(id) on delete set null,
  provider text not null check (provider in ('mock', 'mercado_pago', 'stone', 'tef')),
  payment_type text not null,
  amount numeric(14,2) not null check (amount > 0),
  status text not null check (status in ('approved', 'declined', 'cancelled', 'pending')),
  transaction_id text,
  authorization_code text,
  terminal_id text,
  acquirer_cnpj text,
  card_brand text,
  external_reference text,
  raw_response jsonb not null default '{}'::jsonb,
  created_by uuid references public.user_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (raw_response ? 'card_number' is false),
  check (raw_response ? 'cvv' is false),
  check (raw_response ? 'pin' is false)
);

create table public.nfce_document_items (
  id bigint generated always as identity primary key,
  document_id uuid not null references public.nfce_documents(id) on delete cascade,
  item_number integer not null check (item_number > 0),
  product_id bigint references public.products(id) on delete set null,
  description text not null,
  ncm text not null,
  cest text,
  cfop text not null,
  commercial_unit text not null,
  quantity numeric(14,4) not null check (quantity > 0),
  unit_price numeric(14,4) not null check (unit_price >= 0),
  gross_total numeric(14,2) not null check (gross_total >= 0),
  discount_amount numeric(14,2) not null default 0 check (discount_amount >= 0),
  tax_data jsonb not null default '{}'::jsonb,
  unique (document_id, item_number)
);

create table public.nfce_document_payments (
  id bigint generated always as identity primary key,
  document_id uuid not null references public.nfce_documents(id) on delete cascade,
  method_code text not null,
  method_description text not null,
  amount numeric(14,2) not null check (amount >= 0),
  integration_type text,
  transaction_reference text,
  created_at timestamptz not null default now()
);

create table public.nfce_events (
  id bigint generated always as identity primary key,
  document_id uuid references public.nfce_documents(id) on delete cascade,
  environment text not null check (environment in ('mock', 'homologacao', 'producao')),
  event_type text not null check (event_type in (
    'create', 'validate', 'sign', 'send', 'authorize', 'reject', 'cancel',
    'contingency', 'query', 'resend', 'inutilize'
  )),
  status text not null,
  status_code integer,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.user_profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index nfce_documents_environment_status_idx
  on public.nfce_documents (environment, status, created_at desc);
create index nfce_events_document_created_idx
  on public.nfce_events (document_id, created_at desc);
create index fiscal_product_profiles_status_idx
  on public.fiscal_product_profiles (tax_status, updated_at desc);
create index payment_transactions_sale_idx
  on public.payment_transactions (sale_id, created_at desc);

alter table public.nfce_number_sequences enable row level security;
alter table public.nfce_documents enable row level security;
alter table public.nfce_document_items enable row level security;
alter table public.nfce_document_payments enable row level security;
alter table public.nfce_events enable row level security;
alter table public.fiscal_product_profiles enable row level security;
alter table public.payment_transactions enable row level security;

revoke all on public.nfce_number_sequences from anon, authenticated;
revoke all on public.nfce_documents from anon, authenticated;
revoke all on public.nfce_document_items from anon, authenticated;
revoke all on public.nfce_document_payments from anon, authenticated;
revoke all on public.nfce_events from anon, authenticated;
revoke all on public.fiscal_product_profiles from anon, authenticated;
revoke all on public.payment_transactions from anon, authenticated;

grant select, insert, update, delete on public.nfce_number_sequences to service_role;
grant select, insert, update, delete on public.nfce_documents to service_role;
grant select, insert, update, delete on public.nfce_document_items to service_role;
grant select, insert, update, delete on public.nfce_document_payments to service_role;
grant select, insert, update, delete on public.nfce_events to service_role;
grant select, insert, update, delete on public.fiscal_product_profiles to service_role;
grant select, insert, update, delete on public.payment_transactions to service_role;
grant usage, select on all sequences in schema public to service_role;

create or replace function public.reserve_nfce_number(
  selected_environment text,
  selected_series integer,
  initial_number bigint default 1
)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  reserved_number bigint;
begin
  if selected_environment not in ('mock', 'homologacao', 'producao') then
    raise exception 'Ambiente NFC-e inválido';
  end if;
  if selected_series < 1 or selected_series > 999 or initial_number < 1 then
    raise exception 'Série ou número inicial NFC-e inválido';
  end if;

  insert into public.nfce_number_sequences (environment, series, next_number)
  values (selected_environment, selected_series, initial_number + 1)
  on conflict (environment, series) do update
    set next_number = public.nfce_number_sequences.next_number + 1,
        updated_at = now()
  returning next_number - 1 into reserved_number;

  return reserved_number;
end;
$$;

revoke all on function public.reserve_nfce_number(text, integer, bigint) from public, anon, authenticated;
grant execute on function public.reserve_nfce_number(text, integer, bigint) to service_role;
