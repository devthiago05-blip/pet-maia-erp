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
- Categorias administráveis no PDV, sem categoria digitada livremente.
- Variações opcionais de tamanho, cor e sabor por código de produto.
- Busca, compras, vendas e orçamentos identificam a variação completa.
- Cadastro em lote de variações com preço e estoque independentes.
- Mensagem do WhatsApp separada do código PIX copia e cola.
- Botões independentes para copiar mensagem e copiar somente o PIX.
- Exclusão segura de produtos, preservando históricos de compras e vendas.
- Fundação da Clínica na ficha do pet.
- Prontuário com consulta, profissional, peso, temperatura, queixa, diagnóstico,
  conduta e retorno.
- `npm run lint` e `npm run build` concluídos sem erros.

## Arquivos modificados

- `app/icon.png`
- `app/layout.tsx`
- `app/login/page.tsx`
- `app/pdv/page.tsx`
- `app/pets/[id]/page.tsx`
- `components/pos/CategoryModal.tsx`
- `components/agenda/AppointmentReceiptModal.tsx`
- `components/clinic/NewClinicalRecordModal.tsx`
- `components/branding/BrandLogo.tsx`
- `components/layout/Sidebar.tsx`
- `components/pos/ProductModal.tsx`
- `components/pos/PurchaseModal.tsx`
- `components/pos/SupplierModal.tsx`
- `components/receipts/ReceiptModal.tsx`
- `public/pet-maia-logo-web.png`
- `lib/formatters.ts`
- `services/pos.ts`
- `services/clinical.ts`
- `supabase/sql/004_pos_purchases.sql`
- `supabase/sql/005_product_categories_variations.sql`
- `supabase/sql/006_clinical_records.sql`
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
2. Executar `supabase/sql/005_product_categories_variations.sql` depois do 004.
3. Testar um produto simples e produtos com tamanho, cor ou sabor.
4. Confirmar código no formato `PM000001` para cada variação.
5. Testar produto com tamanhos diferentes, preços e estoques independentes.
6. Testar WhatsApp e colar o PIX como uma segunda mensagem.
7. Executar `supabase/sql/006_clinical_records.sql`.
8. Testar nova consulta na aba Clínica da ficha de um pet.
9. Testar fornecedor e entrada de compra com aumento do estoque.
10. Aplicar RLS por módulo nas tabelas antigas do ERP.
11. Criar testes automatizados para vendas, compras e estoque.
12. Integrar compras do PDV às contas a pagar do Financeiro.
13. Continuar Clínica com anamnese, prescrições, vacinas e exames.

## Próximos passos

1. Segurança: RLS para tutores, pets, agenda, serviços e financeiro.
2. PDV: detalhes/impressão de orçamento, conversão e histórico de vendas.
3. Financeiro: contas a pagar originadas por compras.
4. Clínica: anamnese e prescrição como próximo bloco.
5. Clínica: vacinas, exames e internação em blocos posteriores.
6. Qualidade: testes de integração com Supabase.

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
