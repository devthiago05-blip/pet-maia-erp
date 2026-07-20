alter table public.clinic_settings
  add column if not exists inscricao_estadual text,
  add column if not exists uf text default 'CE',
  add column if not exists codigo_municipio_ibge text,
  add column if not exists regime_tributario text,
  add column if not exists fiscal_environment text default 'homologacao',
  add column if not exists nfce_series integer default 1,
  add column if not exists nfce_next_number bigint default 1;

alter table public.products
  add column if not exists ncm text,
  add column if not exists cfop text default '5102',
  add column if not exists origem_mercadoria text default '0',
  add column if not exists csosn text,
  add column if not exists unidade_comercial text default 'UN';

insert into storage.buckets (id, name, public, file_size_limit)
values ('fiscal-certificates', 'fiscal-certificates', false, 2097152)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit;

-- Sem políticas para anon/authenticated: somente o backend com service_role
-- pode ler ou gravar o certificado e os segredos fiscais.
