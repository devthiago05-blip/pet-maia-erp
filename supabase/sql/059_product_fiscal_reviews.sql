create table if not exists public.product_fiscal_reviews (
  product_id bigint primary key references public.products(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'review', 'approved')),
  suggested_ncm text,
  suggested_cest text,
  suggested_cfop text,
  suggested_origin text,
  suggested_csosn_cst text,
  suggested_pis_cst text,
  suggested_cofins_cst text,
  suggested_unit text,
  source_type text not null default 'manual'
    check (source_type in ('purchase_xml', 'system', 'manual')),
  source_purchase_id bigint references public.product_purchases(id) on delete set null,
  source_description text,
  source_document_number text,
  reviewed_by uuid references public.user_profiles(id) on delete set null,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (suggested_ncm is null or suggested_ncm ~ '^\d{8}$'),
  check (suggested_cest is null or suggested_cest ~ '^\d{7}$'),
  check (suggested_cfop is null or suggested_cfop ~ '^\d{4}$'),
  check (suggested_origin is null or suggested_origin ~ '^\d$'),
  check (suggested_csosn_cst is null or suggested_csosn_cst ~ '^\d{2,3}$'),
  check (suggested_pis_cst is null or suggested_pis_cst ~ '^\d{2}$'),
  check (suggested_cofins_cst is null or suggested_cofins_cst ~ '^\d{2}$'),
  check (suggested_unit is null or suggested_unit ~ '^[A-Z]{1,6}$')
);

create index if not exists product_fiscal_reviews_status_idx
on public.product_fiscal_reviews(status, updated_at desc);

create index if not exists product_fiscal_reviews_source_purchase_idx
on public.product_fiscal_reviews(source_purchase_id)
where source_purchase_id is not null;

create index if not exists product_fiscal_reviews_reviewed_by_idx
on public.product_fiscal_reviews(reviewed_by)
where reviewed_by is not null;

alter table public.product_fiscal_reviews enable row level security;

revoke all on public.product_fiscal_reviews from anon, authenticated;
grant select, insert, update, delete on public.product_fiscal_reviews to service_role;

comment on table public.product_fiscal_reviews is
  'Sugestões fiscais importadas ou calculadas; não são usadas na emissão até aprovação explícita.';
