# Continuar Aqui

## Última tarefa concluída

- Nova identidade visual "Clínica Veterinária Pet Maia".
- Logo integrado ao login, sidebar e recibos.
- Ícone do navegador substituído.
- SVGs padrão do template removidos.
- PDV com código automático de produto.
- Cadastro de fornecedores.
- Entrada de compras com múltiplos itens.
- Atualização transacional de custo e estoque.
- `npm run lint` e `npm run build` concluídos sem erros.

## Arquivos modificados

- `app/icon.png`
- `app/layout.tsx`
- `app/login/page.tsx`
- `app/pdv/page.tsx`
- `components/branding/BrandLogo.tsx`
- `components/layout/Sidebar.tsx`
- `components/pos/ProductModal.tsx`
- `components/pos/PurchaseModal.tsx`
- `components/pos/SupplierModal.tsx`
- `components/receipts/ReceiptModal.tsx`
- `public/pet-maia-logo-web.png`
- `services/pos.ts`
- `supabase/sql/004_pos_purchases.sql`
- `types/domain.ts`

Arquivos padrão removidos:

- `app/favicon.ico`
- `public/file.svg`
- `public/globe.svg`
- `public/next.svg`
- `public/vercel.svg`
- `public/window.svg`

## Pendências

1. Executar `supabase/sql/004_pos_purchases.sql` no SQL Editor do Supabase.
2. Testar cadastro de produto e confirmar código no formato `PM000001`.
3. Testar fornecedor e entrada de compra com aumento do estoque.
4. Aplicar RLS por módulo nas tabelas antigas do ERP.
5. Criar testes automatizados para vendas, compras e estoque.
6. Integrar compras do PDV às contas a pagar do Financeiro.
7. Implementar o módulo Clínica por último.

## Próximos passos

1. Segurança: RLS para tutores, pets, agenda, serviços e financeiro.
2. PDV: detalhes/impressão de orçamento e histórico de vendas.
3. Financeiro: contas a pagar originadas por compras.
4. Qualidade: testes de integração com Supabase.
5. Clínica: prontuário, anamnese, prescrições, exames e internação.

## Comandos necessários

```bash
npm run lint
npm run build
git status
```

Após executar o SQL no Supabase:

```bash
npm run dev
```

Acessar:

```text
http://localhost:3000/pdv
```
