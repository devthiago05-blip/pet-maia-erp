# Executar SQL do modulo de insumos

Atualizado em: 10/07/2026

## Resultado da verificacao

Consulta feita pela Data API do Supabase indicou que as tabelas abaixo ainda nao
existem no schema exposto:

- `grooming_supplies`
- `grooming_supply_movements`
- `groomer_daily_payments`

Resposta observada:

- HTTP `404`
- codigo `PGRST205`
- mensagem indicando que a tabela nao foi encontrada.

Isso significa que o codigo do modulo ja esta publicado, mas o Supabase ainda
precisa receber os scripts SQL antes do uso em producao.

## Ordem recomendada

Execute os scripts no SQL Editor do Supabase nesta ordem:

1. `supabase/sql/023_grooming_supplies.sql`
2. `supabase/sql/025_grooming_financial_rls.sql`
3. `supabase/sql/026_grooming_supply_invoice_reference.sql`
4. `supabase/sql/027_delete_grooming_supply_movement.sql`

O arquivo `supabase/sql/024_legacy_rls_audit.sql` e apenas uma auditoria das
policies antigas. Execute separadamente quando quiser revisar RLS geral do
sistema.

## Como executar

1. Abra o painel do Supabase.
2. Entre no projeto do PET MAIA ERP.
3. Acesse `SQL Editor`.
4. Abra o arquivo `023_grooming_supplies.sql` no projeto local.
5. Copie todo o conteudo.
6. Cole no SQL Editor.
7. Execute.
8. Repita o processo para os scripts `025`, `026` e `027`.

## Resultados esperados

### Script 023

Deve retornar uma linha com:

- `grooming_tables = 3`
- `stock_functions = 2`
- `stock_triggers = 1`

### Script 025

Deve listar as policies:

- `Service users can insert grooming financial entries`
- `Service users can read grooming financial entries`

### Script 026

Deve listar as colunas:

- `document_number`
- `purchase_group_id`

### Script 027

Deve listar a rotina:

- `delete_grooming_supply_movement`

## Depois de executar

Testar no sistema:

1. Abrir `/services/insumos`.
2. Cadastrar um insumo.
3. Registrar entrada.
4. Registrar saida.
5. Excluir uma movimentacao.
6. Confirmar se o estoque voltou corretamente.
7. Registrar compra pendente.
8. Conferir se a conta apareceu no financeiro quando aplicavel.
