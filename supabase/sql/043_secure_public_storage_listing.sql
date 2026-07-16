-- 043_secure_public_storage_listing.sql
-- Mantem os arquivos publicos por URL, mas impede enumerar o bucket inteiro.

begin;

drop policy if exists "site_accessories_public_read" on storage.objects;

commit;
