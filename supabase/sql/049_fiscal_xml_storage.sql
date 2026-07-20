insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'fiscal-xml',
  'fiscal-xml',
  false,
  10485760,
  array['application/xml', 'text/xml']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Sem políticas para anon/authenticated: os XML fiscais são sigilosos e
-- somente rotas administrativas do backend com service_role podem acessá-los.
