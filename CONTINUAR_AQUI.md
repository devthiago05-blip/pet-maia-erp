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
- Produtos agrupados no PDV com seleção de variação e quantidade.
- Histórico detalhado de vendas com itens e impressão.
- Orçamentos com detalhes, impressão e conversão em venda.
- Compras integradas ao Financeiro como contas a pagar.
- Consulta clínica com anamnese, alergias e medicamentos em uso.
- Prescrições vinculadas ao atendimento clínico.
- Receita veterinária imprimível com dados do paciente e profissional.
- Carteira clínica de vacinação com fabricante, lote e próxima dose.
- Módulo Clínica visível na sidebar e na gestão de permissões.
- Página Clínica com pacientes, retornos, vacinas e acesso ao prontuário.
- Exames clínicos com solicitação, coleta, laboratório, status e resultado.
- Exclusão auditável de vendas com devolução integral ao estoque.
- Receita financeira da venda removida automaticamente ao cancelar.
- Módulo CRM com histórico de contatos e próximas ações por tutor.
- Módulo BI com indicadores financeiros, operacionais, PDV e estoque.
- `npm run lint` e `npm run build` concluídos sem erros.

## Arquivos modificados

- `app/icon.png`
- `app/layout.tsx`
- `app/login/page.tsx`
- `app/pdv/page.tsx`
- `app/pets/[id]/page.tsx`
- `app/clinica/page.tsx`
- `app/crm/page.tsx`
- `app/bi/page.tsx`
- `components/pos/CategoryModal.tsx`
- `components/pos/ProductSelectionModal.tsx`
- `components/pos/PosDocumentModal.tsx`
- `components/agenda/AppointmentReceiptModal.tsx`
- `components/clinic/NewClinicalRecordModal.tsx`
- `components/clinic/PrescriptionModal.tsx`
- `components/clinic/PrescriptionDocumentModal.tsx`
- `components/clinic/VaccinationModal.tsx`
- `components/clinic/ExamModal.tsx`
- `components/crm/InteractionModal.tsx`
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
- `supabase/sql/007_pos_operations.sql`
- `supabase/sql/008_clinical_anamnesis_prescriptions.sql`
- `supabase/sql/009_clinical_vaccines.sql`
- `supabase/sql/010_clinic_module_access.sql`
- `supabase/sql/011_clinical_exams.sql`
- `supabase/sql/012_pos_sale_cancellation.sql`
- `supabase/sql/013_crm_bi_modules.sql`
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
9. Executar `supabase/sql/007_pos_operations.sql`.
10. Testar produto com sabores/tamanhos, selecionando variação e quantidade.
11. Testar impressão e conversão de orçamento em venda.
12. Testar compra e confirmar a conta a pagar no Financeiro.
13. Executar `supabase/sql/008_clinical_anamnesis_prescriptions.sql`.
14. Testar anamnese e prescrição em uma consulta clínica.
15. Executar `supabase/sql/009_clinical_vaccines.sql`.
16. Testar impressão de receita e registro de vacina.
17. Executar `supabase/sql/010_clinic_module_access.sql`.
18. Testar o item Clínica no menu e as permissões de usuário.
19. Executar `supabase/sql/011_clinical_exams.sql`.
20. Testar solicitação e atualização do resultado de exame.
21. Executar `supabase/sql/012_pos_sale_cancellation.sql`.
22. Testar exclusão de venda, devolução de estoque e remoção da receita.
23. Executar `supabase/sql/013_crm_bi_modules.sql`.
24. Liberar CRM e BI nas permissões dos usuários necessários.
25. Testar contato no CRM e os indicadores do BI.
26. Aplicar RLS por módulo nas tabelas antigas do ERP.
27. Criar testes automatizados para vendas, compras e estoque.
28. Continuar Clínica com documentos clínicos.

## Próximos passos

1. Segurança: RLS para tutores, pets, agenda, serviços e financeiro.
2. Clínica: documentos e atestados veterinários.
3. Clínica: anexos de exames via Supabase Storage.
4. Clínica: internação em bloco posterior.
5. PDV: cancelamento de vendas e devoluções em etapa futura.
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
