# Continuar Aqui

- Atualizado em: 14/07/2026
- Branch: `main`
  Ultimo commit funcional: `feat(financeiro): adicionar impressao de lancamentos`

## Bloco concluido - agendamentos do site como pendentes

Ultima tarefa concluida:

- Adicionado o status `Pendente` aos agendamentos.
- A tela Agenda agora mostra `Pendente` no filtro de status.
- O Kanban ganhou a coluna `Pendentes` antes de `Agendados`.
- Cards e tabela da Agenda ganharam botao `Confirmar` para mudar de
  `Pendente` para `Agendado`.
- O modal de agendamento permite editar status como:
  - `Pendente`;
  - `Agendado`;
  - `Finalizado`;
  - `Cancelado`.
- Dashboard, BI e Relatorios passaram a considerar o status `Pendente` nos
  resumos de agenda.
- Criada migration `supabase/sql/037_public_site_pending_appointments.sql`.
- A funcao publica `public.create_public_site_appointment(jsonb)` existia no
  Supabase e foi atualizada para gravar novos pedidos do site como
  `Pendente`.
- A validacao da funcao tambem passou a contar `Pendente` e `Agendado` no limite
  de solicitacoes por tutor/data.
- Teste transacional com rollback confirmou que a funcao cria status
  `Pendente` e nao deixou dados de teste.

Arquivos modificados:

- `types/domain.ts`
- `app/agenda/page.tsx`
- `components/agenda/AppointmentCard.tsx`
- `components/agenda/AppointmentTable.tsx`
- `components/agenda/KanbanBoard.tsx`
- `components/agenda/KanbanColumn.tsx`
- `components/agenda/NewAppointmentModal.tsx`
- `app/page.tsx`
- `app/bi/page.tsx`
- `app/relatorios/page.tsx`
- `supabase/sql/037_public_site_pending_appointments.sql`
- `CONTINUAR_AQUI.md`

Pendencias:

- Nenhuma pendencia tecnica deste bloco.

Comandos necessarios para continuar:

```bash
npm.cmd run lint
npm.cmd run build
git diff --check
git add types/domain.ts app/agenda/page.tsx components/agenda/AppointmentCard.tsx components/agenda/AppointmentTable.tsx components/agenda/KanbanBoard.tsx components/agenda/KanbanColumn.tsx components/agenda/NewAppointmentModal.tsx app/page.tsx app/bi/page.tsx app/relatorios/page.tsx supabase/sql/037_public_site_pending_appointments.sql CONTINUAR_AQUI.md
git commit -m "feat(agenda): receber pedidos do site como pendentes"
git push origin main
```

## Bloco concluido - impressao do financeiro

Ultima tarefa concluida:

- Adicionado botao `Imprimir` no topo da tela Financeiro.
- A impressao usa os lancamentos filtrados na tela.
- O relatorio impresso inclui:
  - recebido;
  - a receber;
  - despesas;
  - lucro;
  - descricao;
  - tutor;
  - pet;
  - tipo;
  - valor;
  - data do titulo;
  - vencimento;
  - status.
- A tela normal fica oculta durante a impressao, mantendo um documento limpo.

Arquivos modificados:

- `app/financeiro/page.tsx`
- `CONTINUAR_AQUI.md`

Pendencias:

- Futuro: permitir escolher impressao resumida ou detalhada.

Comandos necessarios para continuar:

```bash
npm.cmd run lint
npm.cmd run build
git diff --check
git add app/financeiro/page.tsx CONTINUAR_AQUI.md
git commit -m "feat(financeiro): adicionar impressao de lancamentos"
git push origin main
```

## Bloco concluido - dashboard de segunda a domingo

Ultima tarefa concluida:

- Ajustado o calculo dos agendamentos da semana no Dashboard.
- A semana agora considera sempre segunda-feira ate domingo.
- O filtro deixou de iniciar no domingo.
- O filtro agora tambem limita o fim da semana no domingo, evitando puxar
  agendamentos de semanas futuras.

Arquivos modificados:

- `services/dashboard.ts`
- `CONTINUAR_AQUI.md`

Pendencias:

- Nenhuma pendencia tecnica deste bloco.

Comandos necessarios para continuar:

```bash
npm.cmd run lint
npm.cmd run build
git diff --check
git add services/dashboard.ts CONTINUAR_AQUI.md
git commit -m "fix(dashboard): mostrar semana de segunda a domingo"
git push origin main
```

## Bloco concluido - equipamentos, laminas e manutencao

Ultima tarefa concluida:

- Criada migration `supabase/sql/036_grooming_equipment.sql`.
- Criadas no Supabase as tabelas:
  - `public.grooming_equipment`;
  - `public.grooming_equipment_services`.
- A tabela de equipamentos cadastra materiais como:
  - secador grande/pequeno;
  - laminas;
  - maquinas;
  - tesouras;
  - outros equipamentos.
- Campos principais do equipamento:
  - nome;
  - tipo;
  - tamanho/modelo;
  - numero de serie;
  - fornecedor;
  - data e valor de compra;
  - status;
  - observacoes.
- Criada aba `Equipamentos` em `Servicos > Insumos`.
- A aba permite registrar envio para manutencao/afiacao com:
  - equipamento;
  - tipo de servico;
  - fornecedor;
  - data de envio;
  - previsao de retorno;
  - data de retorno;
  - custo;
  - status de pagamento;
  - vencimento;
  - observacoes.
- Quando o servico fica `Pendente` e tem custo, o sistema cria despesa em
  `financial_entries` com origem `grooming_equipment_service`.
- Quando a despesa vinculada for paga no Financeiro, o historico do equipamento
  tambem passa para `Pago`.
- O status do equipamento e ajustado automaticamente:
  - `Enviado para afiacao` quando o servico e afiacao pendente;
  - `Em manutencao` para demais servicos pendentes;
  - `Em uso` quando houver retorno ou pagamento como pago.

Arquivos modificados:

- `components/grooming/GroomingSuppliesManager.tsx`
- `services/grooming.ts`
- `services/financial.ts`
- `types/domain.ts`
- `supabase/sql/036_grooming_equipment.sql`
- `CONTINUAR_AQUI.md`

Validacoes executadas:

- `npm.cmd run lint`: aprovado.
- `npm.cmd run build`: aprovado.
- `git diff --check`: aprovado, apenas aviso normal de CRLF no Windows.
- Supabase confirmado no projeto `umlwimsjxbhrrjhrofmd`:
  - `equipment_tables = 2`;
  - `equipment_policies = 4`;
  - `financial_link_columns = 1`.
- Teste transacional com equipamento e afiacao executado com `rollback`, sem
  deixar dado de teste.

Pendencias:

- Futuro: criar botao de baixa/arquivamento visual para equipamentos quebrados
  ou fora de uso.
- Futuro: criar relatorio especifico por fornecedor de manutencao/afiacao.

Comandos necessarios para continuar:

```bash
npm.cmd run lint
npm.cmd run build
git diff --check
git add components/grooming/GroomingSuppliesManager.tsx services/grooming.ts services/financial.ts types/domain.ts supabase/sql/036_grooming_equipment.sql CONTINUAR_AQUI.md
git commit -m "feat(grooming): controlar equipamentos e manutencoes"
git push origin main
```

## Bloco concluido - lembretes de banho recorrentes

Ultima tarefa concluida:

- Criada migration `supabase/sql/035_pet_bath_reminders.sql`.
- Aplicadas no Supabase as colunas em `public.pets`:
  - `bath_reminder_interval_days integer null`;
  - `bath_reminder_dismissed_until date null`.
- Adicionado check para permitir recorrencia opcional apenas em:
  - `7`;
  - `15`;
  - `30`;
  - `null` para sem recorrencia configurada.
- Cadastro e edicao de pet agora possuem campo opcional `Recorrencia de banho`.
- Dashboard usa a recorrencia do pet para gerar lembrete.
- Quando o pet nao tiver recorrencia configurada, o Dashboard usa 30 dias como
  regra padrao para manter o comportamento anterior.
- Lembretes podem ser removidos manualmente.
- Ao clicar em `Enviar WhatsApp` ou `Agendar`, o sistema pergunta se deve tirar
  o pet dos lembretes ate a proxima quinta-feira.
- Se confirmar, grava `bath_reminder_dismissed_until` com a proxima quinta e
  remove o pet da lista atual.
- Se escolher `Manter e continuar`, abre WhatsApp ou Agenda sem remover o
  lembrete.
- Lembretes acima de 45 e 60 dias agora recebem destaque visual e texto de
  WhatsApp mais direto para o tutor.

Arquivos modificados:

- `app/page.tsx`
- `components/pets/EditPetModal.tsx`
- `components/pets/NewPetModal.tsx`
- `services/dashboard.ts`
- `services/pets.ts`
- `types/domain.ts`
- `supabase/sql/035_pet_bath_reminders.sql`
- `CONTINUAR_AQUI.md`

Validacoes executadas:

- `npm.cmd run lint`: aprovado.
- `npm.cmd run build`: aprovado.
- `git diff --check`: aprovado, apenas aviso normal de CRLF no Windows.
- Supabase confirmado no projeto `umlwimsjxbhrrjhrofmd`:
  - colunas criadas em `public.pets`;
  - `total_pets = 47`;
  - `pets_com_recorrencia = 0` no momento;
  - `lembretes_ocultos = 0` no momento.

Pendencias:

- O WhatsApp ainda depende do clique do operador no link `wa.me`; envio
  automatico real exigiria API oficial do WhatsApp/Meta ou provedor externo.
- Configurar recorrencia nos pets que devem usar 7, 15 ou 30 dias.

Comandos necessarios para continuar:

```bash
npm.cmd run lint
npm.cmd run build
git diff --check
git add app/page.tsx components/pets/EditPetModal.tsx components/pets/NewPetModal.tsx services/dashboard.ts services/pets.ts types/domain.ts supabase/sql/035_pet_bath_reminders.sql CONTINUAR_AQUI.md
git commit -m "feat(dashboard): aprimorar lembretes recorrentes de banho"
git push origin main
```

## Bloco concluido - ajustes Financeiro e relatorio operacional

Ultima tarefa concluida:

- Corrigido no Supabase o registro existente da diaria do tosador `Leandro`
  em `2026-07-11`: a diaria estava `Pendente`, mas o financeiro vinculado
  `49` ja estava `Pago`.
- Confirmado no banco que nao ha mais diarias pendentes divergentes com
  financeiro pago: `pendentes_divergentes = 0`.
- `fetchGroomerDailyPayments()` agora reconcilia o status com lancamentos
  financeiros vinculados por `financial_entry_id` ou por
  `origem = 'groomer_daily_payment'` + `referencia_id`.
- Com isso, mesmo se algum dado legado ficar divergente, a tela de diarias e
  alertas passa a tratar como `Pago` quando o financeiro vinculado estiver
  pago.
- Financeiro agora mostra `Data do titulo` na tabela usando `created_at`.
- `Vencimento` fica visivel e gravado apenas para lancamentos do tipo
  `Despesa`.
- Ao marcar um lancamento vinculado como `Pago`, o sistema sincroniza:
  - `groomer_daily_payments.payment_status`;
  - `grooming_supply_movements.payment_status`.
- Isso corrige o alerta de diaria que continuava aparecendo como pendente
  depois do pagamento financeiro.
- Foram adicionados atalhos de despesa operacional nos modais do financeiro:
  - `Manutencao de maquinas`;
  - `Afiacao de lamina`;
  - `Manutencao predial`;
  - `Compra de pecas`.
- Relatorios agora exibem:
  - total de despesas pendentes;
  - card de `Manutencao e afiacao`;
  - ranking de despesas de manutencao, maquinas, pecas e afiacao.

Arquivos modificados:

- `app/relatorios/page.tsx`
- `components/financeiro/EditFinancialModal.tsx`
- `components/financeiro/FinancialTable.tsx`
- `components/financeiro/NewFinancialModal.tsx`
- `services/grooming.ts`
- `services/financial.ts`
- `CONTINUAR_AQUI.md`

Validacoes executadas:

- `npm.cmd run lint`: aprovado.
- `npm.cmd run build`: aprovado.
- `git diff --check`: aprovado, apenas aviso normal de CRLF no Windows.
- Supabase confirmado no projeto `umlwimsjxbhrrjhrofmd`:
  - `financial_entries.origem`;
  - `financial_entries.referencia_id`;
  - `financial_entries.data_vencimento`;
  - `groomer_daily_payments.payment_status`;
  - `groomer_daily_payments.financial_entry_id`;
  - `grooming_supply_movements.payment_status`;
  - `grooming_supply_movements.financial_entry_id`.
- Correcao de dado executada no Supabase para diaria ja paga.

Pendencias:

- Se quiser granularidade maior, criar no futuro uma tabela/categoria formal
  para tipos de despesa operacional. Nesta etapa foi mantido sem alterar banco.
- Se o navegador ainda mostrar pendente, atualizar a pagina ou limpar cache do
  app apos o deploy concluir.

Comandos necessarios para continuar:

```bash
npm.cmd run lint
npm.cmd run build
git diff --check
git add app/relatorios/page.tsx components/financeiro/EditFinancialModal.tsx components/financeiro/FinancialTable.tsx components/financeiro/NewFinancialModal.tsx services/financial.ts services/grooming.ts CONTINUAR_AQUI.md
git commit -m "fix(grooming): reconciliar diarias pagas no financeiro"
git push origin main
```

## Bloco em andamento - observacao e impressao da Agenda

Ultima tarefa concluida:

- Adicionado campo `Observacao` no cadastro e edicao de agendamento.
- A observacao aparece nos cards do kanban e na tabela da agenda.
- A busca da agenda tambem considera o texto da observacao.
- Adicionado botao `Imprimir` na Agenda.
- A impressao usa os agendamentos filtrados:
  - no kanban, imprime o dia exibido;
  - na lista, imprime busca, periodo e status filtrados.
- Criado SQL idempotente para adicionar a coluna no Supabase:
  `supabase/sql/028_appointment_observation.sql`.

Arquivos modificados:

- `app/agenda/page.tsx`
- `app/globals.css`
- `components/agenda/AppointmentCard.tsx`
- `components/agenda/AppointmentTable.tsx`
- `components/agenda/NewAppointmentModal.tsx`
- `services/appointments.ts`
- `types/domain.ts`
- `supabase/sql/028_appointment_observation.sql`
- `CONTINUAR_AQUI.md`

Confirmado no Supabase:

- Migração `appointment_observation` aplicada no projeto
  `umlwimsjxbhrrjhrofmd`.
- Coluna confirmada em `public.appointments`:
  `observacao text null`.
- Advisors executados após a migração.

Pendencias identificadas pelos advisors para bloco futuro:

- `appointment_services` está no schema público sem RLS habilitado.
- Há funções `SECURITY DEFINER` executáveis por `anon`/`authenticated` que
  precisam de revisão de grants.
- Há chaves estrangeiras sem índice, incluindo `appointments.pet_id`.

Comandos necessarios para continuar:

```bash
npm.cmd run lint
npm.cmd run build
git diff --check
git add app/agenda/page.tsx app/globals.css components/agenda/AppointmentCard.tsx components/agenda/AppointmentTable.tsx components/agenda/NewAppointmentModal.tsx services/appointments.ts types/domain.ts supabase/sql/028_appointment_observation.sql CONTINUAR_AQUI.md
git commit -m "feat(agenda): adicionar observacao e impressao"
git push origin main
```

## Bloco concluido - seguranca inicial Supabase

Ultima tarefa concluida:

- Aplicada migração `security_rls_indexes` no Supabase.
- Criado script versionado:
  `supabase/sql/029_security_rls_indexes.sql`.
- `appointment_services` agora tem RLS habilitado.
- Criadas policies para `appointment_services`:
  - leitura para usuarios com acesso a `agenda`, `financeiro` ou `recibos`;
  - insert/update/delete para usuarios com acesso a `agenda`.
- Removido `anon` de RPCs internas do PDV, permissoes e insumos.
- Mantida a funcao publica `get_shared_prescription(uuid)` com acesso `anon`
  porque ela sustenta a rota publica `/receita/[token]`.
- Criados indices de chaves estrangeiras prioritarias em agenda, pets, clinica,
  PDV, compras e produtos.
- Aplicada migração `grooming_function_search_path` no Supabase.
- Criado script versionado:
  `supabase/sql/030_grooming_function_search_path.sql`.
- A funcao `get_grooming_supply_stock_delta(text, numeric)` agora tem
  `search_path = public`.

Confirmacoes no Supabase:

- `appointment_services`: `rls_enabled = true`.
- Policies de select/insert/update/delete confirmadas na tabela.
- Grants confirmados sem `anon` nas RPCs internas.
- Indices principais confirmados, incluindo:
  - `idx_appointment_services_appointment_id`;
  - `idx_appointments_pet_id`;
  - `idx_pets_tutor_id`;
  - `idx_pos_sale_items_sale_id`;
  - `idx_product_purchases_supplier_id`.

Resultado dos advisors apos o bloco:

- O erro `RLS Disabled in Public` de `appointment_services` foi resolvido.
- O aviso `function_search_path_mutable` da funcao de insumos foi resolvido.
- Os avisos de `anon` em funcoes internas foram resolvidos.
- Permanecem avisos de `SECURITY DEFINER` para funcoes autenticadas do PDV,
  permissoes e insumos. Elas continuam acessiveis para `authenticated` por
  necessidade operacional, com checagem interna por modulo.
- Permanece aviso de `get_shared_prescription(uuid)` para `anon`, intencional
  enquanto a receita publica por token existir.
- Permanece configuracao externa do Supabase Auth:
  `Leaked Password Protection Disabled`.

Proximo bloco recomendado:

1. Testar fluxo de agenda finalizada/recibo apos RLS em
   `appointment_services`.
2. Criar auditoria/refatoracao das RPCs `SECURITY DEFINER` para reduzir avisos
   sem quebrar PDV, receitas publicas e permissoes.
3. Otimizar policies de `user_profiles` e `user_permissions` usando
   `(select auth.uid())`.
4. Ativar no painel do Supabase Auth a protecao contra senhas vazadas.

Comandos necessarios para continuar:

```bash
npm.cmd run lint
npm.cmd run build
git diff --check
git add supabase/sql/029_security_rls_indexes.sql supabase/sql/030_grooming_function_search_path.sql CONTINUAR_AQUI.md
git commit -m "chore(supabase): reforcar rls grants e indices"
git push origin main
```

## Bloco em andamento - validacao do cadastro de pet

Ultima tarefa concluida:

- Identificado pela foto do usuario que o cadastro de pet era bloqueado porque
  o campo obrigatorio `Especie` ainda estava no placeholder.
- Ajustado `components/pets/NewPetModal.tsx` para mostrar exatamente quais
  campos obrigatorios faltam no toast.
- Campos obrigatorios agora aparecem com `*`:
  - nome;
  - especie;
  - tutor.
- Apos tentar salvar, campos obrigatorios pendentes ficam destacados em
  vermelho.
- Nenhuma regra de banco foi alterada.

Arquivos modificados:

- `components/pets/NewPetModal.tsx`
- `CONTINUAR_AQUI.md`

Comandos necessarios para continuar:

```bash
npm.cmd run lint
npm.cmd run build
git diff --check
git add components/pets/NewPetModal.tsx CONTINUAR_AQUI.md
git commit -m "fix(pets): detalhar campos obrigatorios no cadastro"
git push origin main
```

## Bloco concluido - otimizacao RLS de usuarios

Ultima tarefa concluida:

- Aplicada migração `optimize_user_access_rls` no Supabase.
- Criado script versionado:
  `supabase/sql/031_optimize_user_access_rls.sql`.
- Atualizadas as funcoes:
  - `public.current_user_is_admin()`;
  - `public.current_user_can_access(text)`.
- As funcoes agora usam `(select auth.uid())` para evitar reavaliacao
  desnecessaria por linha.
- Recriadas as policies:
  - `Users can read own profile`;
  - `Users can read own permissions`.
- As policies agora usam `(select auth.uid())`, mantendo a mesma regra de
  acesso.
- Grants das funcoes foram reforcados:
  - sem acesso para `public`/`anon`;
  - acesso para `authenticated`.

Confirmacoes no Supabase:

- Policies confirmadas com `SELECT auth.uid()` no catalogo `pg_policies`.
- Advisor de performance nao mostra mais os avisos `auth_rls_initplan` para
  `user_profiles` e `user_permissions`.

Pendencias restantes dos advisors:

- Indices recem-criados aparecem como `unused_index`; isso e esperado ate o
  sistema acumular consultas reais e nao deve ser removido agora.
- Persistem avisos de `SECURITY DEFINER` em RPCs autenticadas. Elas exigem um
  bloco proprio para avaliar se podem virar `SECURITY INVOKER` ou se devem
  continuar como estao com checagem por modulo.
- `get_shared_prescription(uuid)` permanece publica por token de forma
  intencional.
- Ativar `Leaked Password Protection` no painel do Supabase Auth.

Comandos necessarios para continuar:

```bash
npm.cmd run lint
npm.cmd run build
git diff --check
git add supabase/sql/031_optimize_user_access_rls.sql CONTINUAR_AQUI.md
git commit -m "chore(supabase): otimizar policies de usuarios"
git push origin main
```

## Bloco concluido - teste transacional da Agenda apos RLS

Ultima tarefa concluida:

- Testado no Supabase o fluxo sensivel apos ativar RLS em
  `appointment_services`.
- O teste simulou um usuario autenticado com acesso a:
  - `agenda`;
  - `financeiro`;
  - `recibos`.
- A transacao executou:
  - selecao de pet real;
  - criacao de agendamento;
  - insercao de servico realizado;
  - exclusao/substituicao de servico realizado, como o app faz ao finalizar;
  - criacao de lancamento financeiro vinculado ao agendamento;
  - leitura de servicos para recibo;
  - leitura do financeiro para recibo;
  - atualizacao do agendamento para `Finalizado`.
- A transacao terminou com `ROLLBACK`, sem deixar dados de teste no banco.

Resultado confirmado:

- `selected_pet_count`: `1`;
- `appointment_created`: `1`;
- `service_delete_policy_ok`: `1`;
- `services_visible_after_replace`: `1`;
- `financial_visible`: `1`;
- `final_status`: `Finalizado`.

Conclusao:

- O RLS novo de `appointment_services` nao quebrou o fluxo de finalizar
  atendimento nem a leitura do recibo para usuario com permissoes corretas.
- Proximo passo funcional recomendado: seguir para PDV avancado
  abertura/fechamento de caixa, sangria/suprimento e pagamentos divididos.

## Estado confirmado

- `npm.cmd run lint`: aprovado.
- `npm.cmd run build`: aprovado com 19 rotas.
- GitHub: `main` atualizado.
- Vercel: deploy acionado pelo push.
- Supabase usado pelo projeto: `umlwimsjxbhrrjhrofmd`.
- `015_clinical_attachments.sql`: tabela e bucket ja existem no Supabase.
- A tabela `pet_vaccinations` estava com zero registros na ultima verificacao.

## Bloco em andamento - Grooming e insumos

Ultima tarefa concluida:

- Corrigidos warnings de lint e conectada a exclusao de movimentacoes de
  insumos em `components/grooming/GroomingSuppliesManager.tsx`.
- A tabela de movimentacoes agora possui acao `Excluir`.
- A exclusao usa `ConfirmationDialog`, sem `alert`, `confirm` ou `prompt`.
- A UI chama `deleteGroomingSupplyMovement`, que usa a RPC
  `delete_grooming_supply_movement`.
- O SQL `027_delete_grooming_supply_movement.sql` foi reforcado com `revoke`
  para impedir execucao por `public` e `anon`, mantendo grant para
  `authenticated`.
- Formatados os arquivos do modulo de grooming/insumos.
- O build atual reconhece 21 rotas, incluindo:
  - `/services/insumos`;
  - `/services/insumos/entrada`.
- Verificacao pela Data API do Supabase em 10/07/2026 indicou que as tabelas
  `grooming_supplies`, `grooming_supply_movements` e
  `groomer_daily_payments` ainda nao existem no projeto remoto: HTTP 404,
  codigo `PGRST205`.
- Criado guia de execucao:
  `docs/EXECUTAR_SQL_GROOMING_SUPABASE.md`.
- A tela de insumos agora identifica `PGRST205` e mostra um painel claro de
  instalacao pendente em vez de liberar formularios que falhariam no Supabase.

Arquivos no bloco atual:

- `app/page.tsx`
- `app/services/page.tsx`
- `app/services/insumos/page.tsx`
- `app/services/insumos/entrada/page.tsx`
- `components/grooming/GroomingSuppliesManager.tsx`
- `services/grooming.ts`
- `types/domain.ts`
- `supabase/sql/023_grooming_supplies.sql`
- `supabase/sql/024_legacy_rls_audit.sql`
- `supabase/sql/025_grooming_financial_rls.sql`
- `supabase/sql/026_grooming_supply_invoice_reference.sql`
- `supabase/sql/027_delete_grooming_supply_movement.sql`
- `docs/EXECUTAR_SQL_GROOMING_SUPABASE.md`
- `CONTINUAR_AQUI.md`

Validacoes:

- `npm.cmd run lint`: aprovado sem warnings.
- `npm.cmd run build`: aprovado com 21 rotas.
- `git diff --check`: aprovado.

Proximos cuidados:

- Executar os scripts no Supabase antes de usar o modulo em producao:
  1. `023_grooming_supplies.sql`
  2. `025_grooming_financial_rls.sql`
  3. `026_grooming_supply_invoice_reference.sql`
  4. `027_delete_grooming_supply_movement.sql`
- O `024_legacy_rls_audit.sql` e apenas auditoria; executar separadamente se
  quiser revisar RLS das tabelas antigas.
- Depois de confirmar SQL, testar cadastro de insumo, entrada/saida, exclusao
  de movimentacao, vencimento, alerta e diaria.

Comandos necessarios para continuar:

```bash
npm.cmd run lint
npm.cmd run build
git diff --check
git add .
git commit -m "feat(grooming): conectar exclusao de movimentacao"
git push origin main
```

## Bloco em andamento - manuais em PDF

Ultima tarefa concluida:

- Criado manual de uso do PET MAIA ERP em Markdown e PDF.
- Criado documento de proximos passos em Markdown e PDF.
- Criado script reproduzivel para gerar novamente os PDFs a partir dos
  arquivos Markdown.

Arquivos criados:

- `docs/MANUAL_USO_PET_MAIA_ERP.md`
- `docs/MANUAL_USO_PET_MAIA_ERP.pdf`
- `docs/PROXIMOS_PASSOS_PET_MAIA_ERP.md`
- `docs/PROXIMOS_PASSOS_PET_MAIA_ERP.pdf`
- `docs/generate-pdfs.mjs`

Validacoes:

- PDFs gerados em `docs/`.
- Cabecalho dos dois PDFs confirmado como `%PDF-1.4`.
- Pendente apenas commit e push deste bloco.

Comandos necessarios para continuar:

```bash
node docs/generate-pdfs.mjs
git diff --check
git add docs/MANUAL_USO_PET_MAIA_ERP.md docs/MANUAL_USO_PET_MAIA_ERP.pdf docs/PROXIMOS_PASSOS_PET_MAIA_ERP.md docs/PROXIMOS_PASSOS_PET_MAIA_ERP.pdf docs/generate-pdfs.mjs CONTINUAR_AQUI.md
git commit -m "docs: adicionar manuais do pet maia erp"
git push origin main
```

## Proximo bloco recomendado - revisao de seguranca RLS

Motivo:

- O sistema ja possui varios modulos funcionais.
- Antes de adicionar recursos grandes, o melhor ganho e revisar seguranca das
  tabelas antigas no Supabase.
- A prioridade e evitar que um usuario autenticado acesse modulos ou dados sem
  permissao correta.

Objetivo do proximo bloco:

- Auditar politicas RLS das tabelas principais.
- Criar SQL idempotente apenas para corrigir permissoes quando necessario.
- Nao remover dados.
- Nao alterar regras de negocio.
- Nao quebrar integracao com Supabase.

Tabelas para revisar primeiro:

- `tutors`
- `pets`
- `appointments`
- `services`
- `financial_entries`
- tabelas do PDV
- tabelas da Clinica
- tabelas de CRM/BI

Arquivos provaveis:

- `supabase/sql/*.sql`
- `lib/access-control.ts`
- `services/*.ts`
- `types/domain.ts`
- `CONTINUAR_AQUI.md`

Comandos de validacao:

```bash
npm.cmd run lint
npm.cmd run build
git diff --check
```

Prompt para continuar em outro chat:

```text
Voce esta trabalhando no projeto PET MAIA ERP em
C:\Users\thiago lima\Desktop\pet-maia-erp.

Contexto:
- Next.js 16, TypeScript, Tailwind CSS, Supabase e Vercel.
- Usar npm.cmd, nao npm.
- Antes de alterar Next.js, ler guia relevante em node_modules/next/dist/docs/.
- Para Supabase, criar SQL idempotente e pedir para o usuario executar quando
  houver mudanca de banco.
- Depois de qualquer alteracao aprovada, executar:
  npm.cmd run lint
  npm.cmd run build
  git diff --check
- Se passar, fazer git add, commit e push para main.
- Atualizar CONTINUAR_AQUI.md antes de encerrar.

Ultimos blocos concluidos:
- Clinica com fila de retornos.
- Clinica com avisos de vacinas.
- Filtros nas filas clinicas.
- Catalogo de medicamentos na Clinica.
- PDFs criados:
  docs/MANUAL_USO_PET_MAIA_ERP.pdf
  docs/PROXIMOS_PASSOS_PET_MAIA_ERP.pdf

Proxima tarefa:
Fazer auditoria de seguranca RLS no Supabase.
Revisar tabelas tutors, pets, appointments, services, financial_entries, PDV,
Clinica, CRM e BI.
Identificar politicas que usam apenas authenticated sem autorizacao por modulo.
Preparar script SQL idempotente para corrigir usando
public.current_user_can_access('<modulo>') quando necessario.
Nao executar SQL diretamente; enviar o script para o usuario copiar e colar no
Supabase.
```

## Ultima tarefa concluida

- Receita veterinaria impressa reorganizada em padrao profissional.
- Arquivo funcional alterado:
  `components/clinic/PrescriptionDocumentModal.tsx`.
- O documento agora possui cabecalho Pet Maia, identificacao separada de animal
  e responsavel, instrucoes numeradas, secao de manipulados, data por extenso e
  assinatura eletronica.
- Quantidades nao sao inferidas. A instrucao usa somente dose, frequencia,
  duracao e observacoes ja cadastradas.
- Nenhuma alteracao de banco ou regra de negocio foi realizada.
- A pre-visualizacao real do VetSmart foi conferida em 08/07/2026. O layout foi
  aproximado ao documento observado: cidade `Fortaleza` no cabecalho, caixas de
  animal e responsavel empilhadas, folha A4 e medicamentos em blocos compactos.
- Uma formula de teste foi iniciada no VetSmart, mas descartada sem salvar
  porque o cadastro real nao permitiu identificar todos os campos com `TESTE`
  de forma segura. Nenhum registro temporario ficou para excluir.
- Pendencia futura: transformar cidade, via de administracao, farmacia e
  quantidade em dados estruturados. Ate la, a receita nao inventa esses campos.
- Validacoes: `npm.cmd run lint`, `npm.cmd run build` e `git diff --check`
  aprovados.

## Receituario inspirado no VetSmart

- Fluxo de criacao, edicao, configuracao e pre-visualizacao analisado no
  VetSmart em 08/07/2026.
- Campos identificados: industrializado/manipulado, tipo de receita, farmacia,
  via, quantidade/unidade, forma farmaceutica, composicao, posologia,
  instrucoes gerais, data, assinatura e configuracao da impressao.
- Script preparado: `supabase/sql/017_prescription_details.sql`.
- Proximo passo obrigatorio: executar o script completo no SQL Editor do
  Supabase e enviar o resultado do `select` final.
- Depois do SQL: atualizar `types/domain.ts`, `services/clinical.ts`,
  `components/clinic/PrescriptionModal.tsx` e
  `components/clinic/PrescriptionDocumentModal.tsx`.
- O script apenas adiciona colunas retrocompativeis na tabela existente; nao
  altera RLS e nao remove dados.

### Estado apos execucao do SQL 017

- SQL confirmado pelo usuario em 08/07/2026: oito colunas criadas corretamente.
- Editor avancado implementado em `components/clinic/PrescriptionModal.tsx`.
- Exclusao segura implementada em
  `components/clinic/PrescriptionDeleteButton.tsx`.
- Persistencia atualizada em `services/clinical.ts` e `types/domain.ts`.
- Prontuario e impressao atualizados em `app/pets/[id]/page.tsx` e
  `components/clinic/PrescriptionDocumentModal.tsx`.
- Analise completa: `docs/ANALISE_RECEITUARIO_VETSMART.md`.
- Validacoes locais: lint, build com 19 rotas e diff-check aprovados.
- Proximo bloco recomendado: entidade de receita para agrupar varios itens,
  instrucoes gerais, status de emissao e previa digital.

### Bloco de agrupamento iniciado

- Script preparado: `supabase/sql/018_prescription_documents.sql`.
- O script cria a entidade de receita, adiciona data, instrucoes gerais,
  rascunho/emissao/cancelamento e vincula automaticamente os itens antigos.
- A migracao e idempotente e mantem as prescricoes existentes.
- Proximo passo: executar o SQL 018 no Supabase e enviar os tres totais do
  `select` final.
- Depois do SQL: implementar criacao do rascunho, varios itens por receita,
  revisao, emissao e historico agrupado na ficha do pet.

### Agrupamento implementado

- SQL 018 confirmado: 1 documento, 1 item vinculado e zero itens orfaos.
- Novos itens entram automaticamente no rascunho aberto da consulta.
- A revisao permite incluir instrucoes gerais e emitir/imprimir a receita.
- Depois da emissao, um novo item inicia outra receita sem alterar o documento
  anterior.
- O prontuario agora exibe receitas agrupadas, status, data e quantidade de
  itens em `components/clinic/PrescriptionGroups.tsx`.
- Persistencia e carregamento agrupado: `services/clinical.ts`.
- Tipos: `types/domain.ts`.
- Proximo bloco: catalogo pesquisavel de medicamentos/principios ativos e
  formulas manipuladas com varios componentes estruturados.

### Catalogo e formulas iniciado

- Script preparado: `supabase/sql/019_medication_catalog_formulas.sql`.
- Cria catalogo pesquisavel com principio ativo, favoritos e valores padrao.
- Cria modelos de posologia definidos pela propria clinica, sem doses
  automaticas pre-cadastradas.
- Cria varios componentes estruturados por formula manipulada.
- Inclui RLS, grants explicitos, indices, auditoria opcional e 11 medicamentos
  iniciais sem recomendacao de dose.
- Proximo passo: executar o SQL 019 e enviar os tres totais do `select` final.

### Catalogo e formulas implementados

- SQL 019 confirmado: 11 medicamentos, zero modelos e zero componentes
  iniciais, conforme esperado.
- Busca por nome e principio ativo conectada ao editor de prescricao.
- Favoritos e valores padrao do medicamento sao aplicados no formulario.
- A clinica pode salvar e reutilizar modelos de posologia; nenhum modelo e
  aplicado sem selecao do profissional.
- Formula manipulada aceita varios componentes, concentracoes e unidades.
- Componentes sao sincronizados ao editar e aparecem na impressao.
- Arquivos principais: `components/clinic/PrescriptionModal.tsx`,
  `components/clinic/PrescriptionDocumentModal.tsx`, `services/clinical.ts` e
  `types/domain.ts`.
- Proximo bloco: assinatura configuravel, estado do CRMV, registro MAPA e
  previa digital compartilhavel.

### Assinatura e compartilhamento iniciado

- Script preparado: `supabase/sql/020_prescription_signature_sharing.sql`.
- Adiciona UF do CRMV, registro MAPA e texto de assinatura ao perfil.
- Salva uma copia desses dados no documento para preservar o historico.
- Adiciona token UUID, ativacao de compartilhamento e contador de reemissao.
- A funcao publica retorna somente receitas emitidas, com compartilhamento
  ativo e token correto; nenhuma policy anonima de leitura direta foi criada.
- Proximo passo: executar o SQL 020 e enviar os tres totais finais.

### Assinatura e compartilhamento implementados

- SQL 020 confirmado: 3 campos de perfil, 1 token e zero receitas expostas.
- Configuracoes permite informar UF do CRMV, MAPA e texto de assinatura.
- A emissao salva esses dados no documento como historico imutavel da receita.
- Receitas emitidas possuem acao para gerar/copiar e desativar o link.
- Rota publica: `app/receita/[token]/page.tsx`.
- Token invalido testado pela Data API: HTTP 200 com corpo `null`.
- O AuthGuard libera apenas `/login` e caminhos com prefixo `/receita/`.
- Proximo bloco: reemissao auditada, rotacao de link e regras documentais por
  tipo de receita.

### Regras documentais sem novo SQL

- Bloco validado em 08/07/2026.
- Compartilhamento de receita agora confere se o documento esta emitido e se
  possui profissional/CRMV antes de gerar ou copiar link publico.
- Ao emitir uma receita, o servico reforca o CRMV atual do perfil no historico
  do documento, junto com UF do CRMV, MAPA e assinatura ja existentes.
- O card do receituario exibe etiquetas de tipo da receita: simples, controle
  especial e antimicrobiano.
- O card tambem mostra pendencias para revisao quando faltar item, CRMV/UF no
  historico, quantidade estruturada em receitas especiais, composicao de formula
  manipulada ou via de administracao.
- Arquivos alterados neste bloco:
  - `components/clinic/PrescriptionGroups.tsx`
  - `components/clinic/PrescriptionShareButton.tsx`
  - `services/clinical.ts`
  - `CONTINUAR_AQUI.md`
- Proximo bloco recomendado: criar SQL para reemissao auditada e rotacao de
  token de compartilhamento.

### Reemissao auditada e rotacao de link iniciado

- Script preparado: `supabase/sql/021_prescription_reissue_rotation.sql`.
- O script cria a tabela `clinical_prescription_reissues` para registrar cada
  reemissao de receita com token anterior, token novo, motivo, usuario e data.
- O script cria a funcao RPC de rotacao do token publico da receita emitida e
  invalida o link antigo.
- A funcao exige acesso ao modulo `clinica` ou `pets`, usa RLS, nao concede
  leitura anonima da tabela e mantem a rota publica usando apenas token valido.
- Proximo passo obrigatorio: executar o SQL 021 no SQL Editor do Supabase e
  enviar o resultado do `select` final.
- Resultado esperado apos a primeira execucao:
  - `prescription_reissue_tables`: `1`
  - `rotate_token_functions`: `1`
  - `prescription_reissues`: `0`
- Depois do SQL confirmado: conectar a UI para permitir reemitir receita com
  motivo, copiar novo link e exibir contador/historico de reemissoes.

### Reemissao auditada conectada na UI

- SQL 021 confirmado pelo usuario em 08/07/2026:
  `prescription_reissue_tables=1`, `rotate_token_functions=1`,
  `prescription_reissues=0`.
- O prontuario agora carrega o historico de reemissoes junto da receita.
- O botao de compartilhamento permite reemitir o link publico com motivo
  opcional, invalida o token anterior, copia o novo link e recarrega o
  prontuario.
- O card da receita exibe contador de reemissoes, data da ultima reemissao e o
  ultimo motivo quando existir.
- Arquivos alterados neste bloco:
  - `app/pets/[id]/page.tsx`
  - `components/clinic/PrescriptionGroups.tsx`
  - `components/clinic/PrescriptionShareButton.tsx`
  - `services/clinical.ts`
  - `types/domain.ts`
  - `CONTINUAR_AQUI.md`
- Proximo bloco recomendado: exibir historico completo de reemissoes em um
  painel expansivel e criar regras especificas por tipo de receita antes de
  impressao/compartilhamento.

### Historico completo de reemissoes

- O botao de compartilhamento da receita agora possui um painel expansivel de
  historico quando ja existem reemissoes.
- O painel mostra cada reemissao com data/hora, motivo e token antigo/novo
  abreviado para auditoria operacional sem poluir a tela.
- Nenhum novo SQL foi necessario; a tela usa os dados de
  `clinical_prescription_reissues` ja carregados no prontuario.
- Arquivo alterado neste bloco:
  - `components/clinic/PrescriptionShareButton.tsx`
  - `CONTINUAR_AQUI.md`
- Proximo bloco recomendado: regras especificas por tipo de receita antes de
  imprimir/compartilhar.

### Regras por tipo de receita

- Bloco iniciado em 09/07/2026 sem novo SQL.
- Criado o utilitario `lib/prescription-document-rules.ts` para centralizar
  regras de emissao, impressao e compartilhamento.
- A impressao/emissao agora mostra uma revisao antes da receita e bloqueia o
  botao quando existe pendencia critica.
- O compartilhamento tambem usa as mesmas regras e nao gera link publico se
  faltar dado critico.
- Regras aplicadas neste bloco:
  - receita sem item;
  - profissional sem identificacao;
  - receita emitida sem CRMV;
  - item sem dose, frequencia ou via de administracao;
  - receita especial/antimicrobiana sem quantidade e unidade;
  - antimicrobiano sem duracao;
  - formula manipulada sem composicao estruturada.
- Alertas nao bloqueantes:
  - UF do CRMV ausente no historico da emissao;
  - responsavel ou endereco do tutor ausente;
  - forma farmaceutica ausente em controle especial manipulado quando aplicavel.
- Arquivos alterados neste bloco:
  - `lib/prescription-document-rules.ts`
  - `components/clinic/PrescriptionDocumentModal.tsx`
  - `components/clinic/PrescriptionGroups.tsx`
  - `components/clinic/PrescriptionShareButton.tsx`
  - `CONTINUAR_AQUI.md`
- Proximo bloco recomendado: linha do tempo clinica unificada na ficha do pet.

### Linha do tempo clinica unificada

- Bloco iniciado em 09/07/2026 sem novo SQL.
- A aba `Clinica` da ficha do pet agora mostra uma linha do tempo com os
  eventos clinicos mais recentes.
- Eventos reunidos:
  - consultas;
  - receitas;
  - vacinas;
  - exames;
  - documentos clinicos.
- A linha do tempo exibe data, tipo, titulo, resumo e marcador visual por
  categoria.
- Arquivos alterados neste bloco:
  - `app/pets/[id]/page.tsx`
  - `CONTINUAR_AQUI.md`
- Proximo bloco recomendado: retornos clinicos com fila semanal.

### Comandos para continuar

```powershell
npm.cmd run lint
npm.cmd run build
git status --short
```

## O que fazer agora

### 1. Executar o SQL final da Clinica

Abra o SQL Editor do Supabase e execute o arquivo completo:

`supabase/sql/016_clinical_professionals_audit.sql`

Esse script:

- adiciona CRMV e especialidade ao perfil do usuario;
- registra CRMV em novos prontuarios e documentos;
- cria a tabela `clinical_audit_logs`;
- cria auditoria automatica para consultas, prescricoes, vacinas, exames,
  documentos e anexos.

O script foi validado com `BEGIN` e `ROLLBACK`, mas ainda precisa ser executado
sem rollback no SQL Editor.

### 2. Configurar o profissional

1. Acesse `Configuracoes`.
2. Preencha `CRMV` e `Especialidade`.
3. Clique em `Salvar perfil`.
4. Crie uma nova consulta e uma nova receita.
5. Confirme se o CRMV aparece na impressao.

### 3. Testar lembrete de vacina

1. Abra a ficha de um pet.
2. Entre na aba `Vacinas`.
3. Cadastre uma vacina preenchendo `Proxima dose`.
4. Use uma data entre hoje e os proximos 30 dias.
5. Atualize a pagina e abra o sino no Header.

Faixas implementadas:

- atrasada em ate 90 dias;
- vence hoje;
- vence em ate 7 dias;
- proxima dose em ate 30 dias.

### 4. Testar anexos clinicos

1. Abra `Ficha do Pet > Exames`.
2. Crie ou edite um exame.
3. Anexe PDF, JPG, PNG ou WebP de ate 10 MB.
4. Teste abrir e excluir o arquivo.

## Arquivos da Clinica

- Pagina central: `app/clinica/page.tsx`
- Ficha e prontuario: `app/pets/[id]/page.tsx`
- Documentos: `components/clinic/ClinicalDocumentModal.tsx`
- Receita impressa: `components/clinic/PrescriptionDocumentModal.tsx`
- Cadastro de medicacao: `components/clinic/PrescriptionModal.tsx`
- Consulta: `components/clinic/NewClinicalRecordModal.tsx`
- Vacinas: `components/clinic/VaccinationModal.tsx`
- Exames: `components/clinic/ExamModal.tsx`
- Anexos: `components/clinic/ExamAttachments.tsx`
- Regras Supabase: `services/clinical.ts`
- Tipos: `types/domain.ts`
- Notificacoes: `components/layout/Header.tsx` e `services/notifications.ts`
- Perfil profissional: `app/settings/page.tsx` e `services/settings.ts`

## Proximas alteracoes recomendadas

### Plano de usabilidade Clinica inspirado no VetSmart

Manter a identidade visual do PET MAIA. Reproduzir apenas fluxos e ergonomia.

1. **Acesso rapido ao paciente - concluido**
   - busca global por tutor, pet ou ID no Header;
   - acesso direto a ficha do pet;
   - abertura da pagina de tutores com filtro aplicado.
2. **Ficha clinica organizada**
   - dados complementares do pet;
   - observacoes internas separadas;
   - exportacao/compartilhamento do historico em PDF.
3. **Retornos clinicos**
   - fila semanal de retornos;
   - filtros por periodo, tutor, pet e profissional;
   - acesso direto ao prontuario.
4. **Vacinacao guiada**
   - aplicada ou programada;
   - dose atual e total de doses;
   - protocolo e proxima dose;
   - observacao interna.
5. **Agenda e prescricao avancadas**
   - bloqueio de horario e evento livre;
   - formula manipulada e produto industrializado;
   - catalogo pesquisavel de medicamentos.
6. **Acabamento e qualidade**
   - estados vazios, responsividade e acessibilidade;
   - testes de integracao dos fluxos clinicos;
   - revisao final de RLS e auditoria.

Arquivos alterados no bloco 1:

- `components/layout/GlobalSearch.tsx`
- `components/layout/Header.tsx`
- `services/global-search.ts`
- `app/tutors/page.tsx`

### Referencia analisada - VetSmart

Analise visual realizada em 08/07/2026, em modo somente leitura.

Pontos fortes observados que fazem sentido no PET MAIA:

- busca global por tutor, pet ou ID;
- ficha do pet com abas para historico, pesos, consultas, vacinas e prescricoes;
- dados complementares e observacoes internas do animal em secoes separadas;
- compartilhamento do historico clinico;
- retornos clinicos em uma fila semanal propria;
- agenda com bloqueio de horario, evento livre e agendamento para animal;
- vacina aplicada ou programada, protocolo, dose atual e total de doses;
- observacao privada da vacina e decisao explicita sobre proxima dose;
- prescricao separando formula manipulada e produto industrializado;
- pesquisa de medicamento, alimento ou principio ativo;
- painel da clinica com profissionais e CRMV.

Nao copiar agora:

- internacao, pois esta fora do escopo atual;
- publicidade e conteudo promocional no painel;
- identidade visual do VetSmart;
- recursos dependentes de assinatura ou integracoes de terceiros.

Ordem sugerida para aproximar a Clinica do fluxo analisado:

1. busca global por tutor, pet e ID no Header;
2. dados complementares e observacoes internas do pet;
3. retorno semanal separado da agenda geral;
4. vacina com status, dose atual, total e protocolo;
5. agenda com bloqueio e evento livre;
6. formula manipulada e catalogo pesquisavel de medicamentos;
7. compartilhamento do historico clinico em PDF;
8. resumo clinico automatizado somente depois da auditoria e dos testes.

### Prioridade 1 - Seguranca das tabelas antigas

Criar `supabase/sql/017_legacy_module_rls.sql`.

Revisar RLS de:

- `tutors`;
- `pets`;
- `appointments`;
- `services`;
- `financial_entries`.

Cada politica deve usar `public.current_user_can_access('<modulo>')`. Nao usar
somente `to authenticated`, pois isso autentica o usuario sem limitar o modulo.

### Prioridade 2 - Finalizar o PDV

Implementar nesta ordem:

1. abertura e fechamento de caixa;
2. sangria e suprimento;
3. pagamentos divididos;
4. devolucao parcial;
5. inventario e ajustes de estoque;
6. testes automatizados.

Arquivos principais:

- `app/pdv/page.tsx`
- `services/pos.ts`
- `types/domain.ts`
- novo SQL `supabase/sql/018_pos_cash_register.sql`

### Prioridade 3 - Catalogos administraveis da Clinica

Mover os modelos fixos de documentos e medicamentos para modulos proprios e,
depois, para tabelas administraveis no Supabase.

## Exemplo de instrucao de alteracao por arquivo

Use este formato nas proximas tarefas para deixar a continuidade objetiva.

### Documento clinico

Arquivo: `components/clinic/ClinicalDocumentModal.tsx`

Localize o bloco que inicia com:

```tsx
const documentTemplates: Array<{
```

Remova todo o array local e substitua por:

```tsx
import { clinicalDocumentTemplates } from "@/lib/clinical-document-templates";
```

Depois substitua:

```tsx
documentTemplates.find(...)
documentTemplates.map(...)
```

por:

```tsx
clinicalDocumentTemplates.find(...)
clinicalDocumentTemplates.map(...)
```

Crie `lib/clinical-document-templates.ts` exportando o array atual sem alterar
os textos ou os tipos dos documentos.

### Catalogo de medicamentos

Arquivo: `components/clinic/PrescriptionModal.tsx`

Localize:

```tsx
const medicationOptions = [
```

Mova o array para `lib/clinical-medications.ts` e substitua o bloco local por:

```tsx
import { clinicalMedicationOptions } from "@/lib/clinical-medications";
```

Substitua todas as referencias a `medicationOptions` por
`clinicalMedicationOptions`.

## Regras para continuar

- Ler o guia relevante em `node_modules/next/dist/docs/` antes de alterar Next.js.
- Nao alterar regras de negocio existentes sem aprovacao.
- Nao executar SQL destrutivo.
- Criar scripts SQL numerados e idempotentes.
- Habilitar RLS em toda tabela nova no schema `public`.
- Validar alteracoes com:

```bash
npm.cmd run lint
npm.cmd run build
git diff --check
```

- Depois de validar:

```bash
git add <arquivos-alterados>
git commit -m "mensagem objetiva"
git push origin main
```

## Status aproximado

- Clinica sem internacao/leitos: 95%.
- Agenda: funcional para a operacao atual.
- PDV: nucleo funcional; caixa e operacoes avancadas ainda pendentes.
- Prioridade geral seguinte: RLS antigo, PDV e testes automatizados.

## Bloco em andamento - fila semanal de retornos

Ultima tarefa concluida:

- Clinica recebeu uma fila operacional de retornos com atrasados, retornos de
  hoje e proximos 7 dias.
- A fila usa o campo existente `clinical_records.return_date`; nenhum SQL novo
  foi necessario.
- Cada item mostra pet, tutor, data de retorno, consulta base, profissional e
  link direto para abrir o prontuario.
- A tabela tem rolagem horizontal controlada para mobile.

Arquivos modificados:

- `app/clinica/page.tsx`
- `types/domain.ts`
- `CONTINUAR_AQUI.md`

Validacoes:

- `npm.cmd run lint`: aprovado.
- `npm.cmd run build`: aprovado com 19 rotas.
- `git diff --check`: aprovado.
- Commit e push concluidos.

Proximos passos sugeridos:

1. Melhorar avisos de vacina na tela central da Clinica.
2. Criar filtros rapidos na fila: atrasados, hoje, 7 dias.
3. Avancar para catalogos administraveis da Clinica.
4. Revisar RLS antigo de tutores, pets, agenda, servicos e financeiro.

Comandos necessarios para continuar:

```bash
npm.cmd run lint
npm.cmd run build
git diff --check
git add app/clinica/page.tsx types/domain.ts CONTINUAR_AQUI.md
git commit -m "feat(clinica): adicionar fila semanal de retornos"
git push origin main
```

## Bloco em andamento - avisos de vacina na Clinica

Ultima tarefa concluida:

- Clinica recebeu um painel `Vacinas em atencao`.
- O painel mostra doses atrasadas, doses do dia e proximas doses em ate 30
  dias.
- Cada item mostra pet, tutor, vacina, data da aplicacao anterior, data da
  proxima dose, profissional e link direto para abrir o prontuario.
- A consulta da Clinica passou a buscar campos ja existentes de
  `pet_vaccinations`: `id`, `vaccine_name`, `application_date`,
  `professional_name` e `next_dose_date`.
- Nenhum SQL novo foi necessario.

Arquivos modificados:

- `app/clinica/page.tsx`
- `services/clinical.ts`
- `types/domain.ts`
- `CONTINUAR_AQUI.md`

Validacoes:

- `npm.cmd run lint`: aprovado.
- `npm.cmd run build`: aprovado com 19 rotas.
- `git diff --check`: aprovado.
- Commit e push concluidos.

Proximos passos sugeridos:

1. Criar filtros rapidos para retornos e vacinas.
2. Avancar para catalogos administraveis da Clinica.
3. Revisar RLS antigo de tutores, pets, agenda, servicos e financeiro.

Comandos necessarios para continuar:

```bash
npm.cmd run lint
npm.cmd run build
git diff --check
git add app/clinica/page.tsx services/clinical.ts types/domain.ts CONTINUAR_AQUI.md
git commit -m "feat(clinica): adicionar avisos de vacinas"
git push origin main
```

## Bloco em andamento - filtros das filas clinicas

Ultima tarefa concluida:

- As filas `Fila de retornos` e `Vacinas em atencao` receberam filtros rapidos.
- Filtros disponiveis:
  - todos;
  - atrasados;
  - hoje;
  - proximos 7 dias para retornos;
  - proximos 30 dias para vacinas.
- Os filtros sao locais a cada painel e nao interferem na busca geral de
  pacientes.
- Nenhum SQL novo foi necessario.

Arquivos modificados:

- `app/clinica/page.tsx`
- `CONTINUAR_AQUI.md`

Validacoes:

- `npm.cmd run lint`: aprovado.
- `npm.cmd run build`: aprovado com 19 rotas.
- `git diff --check`: aprovado.
- Commit e push concluidos.

Proximos passos sugeridos:

1. Avancar para catalogos administraveis da Clinica.
2. Revisar RLS antigo de tutores, pets, agenda, servicos e financeiro.
3. Depois da Clinica, retomar PDV avancado: caixa, sangria/suprimento e
   pagamentos divididos.

Comandos necessarios para continuar:

```bash
npm.cmd run lint
npm.cmd run build
git diff --check
git add app/clinica/page.tsx CONTINUAR_AQUI.md
git commit -m "feat(clinica): adicionar filtros nas filas clinicas"
git push origin main
```

## Bloco em andamento - catalogo administravel da Clinica

Ultima tarefa concluida:

- A tela da Clinica recebeu a secao `Catalogo da clinica`.
- Agora e possivel cadastrar, editar, favoritar e arquivar medicamentos do
  catalogo usado pelo receituario.
- O cadastro usa a tabela existente `medication_catalog`; nenhum SQL novo foi
  necessario.
- Campos do cadastro:
  - nome;
  - principio ativo;
  - farmacia padrao;
  - forma padrao;
  - via padrao;
  - observacoes;
  - favorito.
- Medicamentos arquivados deixam de aparecer no catalogo ativo usado pelo
  receituario.

Arquivos modificados:

- `app/clinica/page.tsx`
- `components/clinic/ClinicalCatalogManager.tsx`
- `services/clinical.ts`
- `types/domain.ts`
- `CONTINUAR_AQUI.md`

Validacoes:

- `npm.cmd run lint`: aprovado.
- `npm.cmd run build`: aprovado com 19 rotas.
- `git diff --check`: aprovado.
- Supabase Data API: `medication_catalog` respondeu HTTP 200 em consulta anonima
  de verificacao; retorno vazio esperado quando RLS nao libera dados anonimos.
- Pendente apenas commit e push deste bloco.

Status comparado ao VetSmart:

- O fluxo da Clinica esta parecido na estrutura principal: prontuario por pet,
  receituario, medicamentos/catalogo, modelos de posologia, documentos, exames,
  vacinas, retornos e filas operacionais.
- Ainda nao esta igual ao VetSmart em profundidade. Faltam recursos avancados
  como catalogos completos com bulas/monografias, protocolos clinicos,
  documentos administraveis via banco, assinatura/documentacao regulatoria mais
  ampla e automacoes de comunicacao.
- Para a operacao atual do Pet Maia, a Clinica esta funcional e bem proxima no
  fluxo basico de uso, mantendo a estetica propria do sistema.

Proximos passos sugeridos:

1. Se quiser aproximar mais do VetSmart, criar SQL para modelos de documentos
   clinicos administraveis.
2. Criar catalogo clinico avancado: principios ativos, observacoes, alertas e
   modelos por especie.
3. Revisar RLS antigo de tutores, pets, agenda, servicos e financeiro.
4. Retomar PDV avancado: caixa, sangria/suprimento e pagamentos divididos.

Comandos necessarios para continuar:

```bash
npm.cmd run lint
npm.cmd run build
git diff --check
git add app/clinica/page.tsx components/clinic/ClinicalCatalogManager.tsx services/clinical.ts types/domain.ts CONTINUAR_AQUI.md
git commit -m "feat(clinica): adicionar catalogo de medicamentos"
git push origin main
```

## Bloco em andamento - caixa do PDV

Ultima tarefa concluida:

- Criada a estrutura de caixa do PDV no Supabase.
- Criado script versionado:
  `supabase/sql/032_pos_cash_register.sql`.
- Novas tabelas:
  - `pos_cash_registers`;
  - `pos_cash_movements`.
- Novas RPCs:
  - `open_pos_cash_register(numeric, text)`;
  - `add_pos_cash_movement(bigint, text, numeric, text)`;
  - `close_pos_cash_register(bigint, numeric, text)`;
  - `recalculate_pos_cash_expected(bigint)`.
- A tela do PDV recebeu a aba `Caixa`.
- A aba permite:
  - abrir caixa;
  - registrar suprimento;
  - registrar sangria;
  - fechar caixa;
  - ver movimentacoes do caixa aberto;
  - ver historico recente de caixas.

Confirmacoes no Supabase:

- Migracao `pos_cash_register` aplicada no projeto `umlwimsjxbhrrjhrofmd`.
- Teste transacional executado com rollback:
  - abertura: R$ 100,00;
  - suprimento: R$ 50,00;
  - sangria: R$ 20,00;
  - fechamento: R$ 130,00;
  - diferenca final: R$ 0,00.

Arquivos modificados:

- `app/pdv/page.tsx`
- `services/pos.ts`
- `types/domain.ts`
- `supabase/sql/032_pos_cash_register.sql`
- `CONTINUAR_AQUI.md`

Pendencias:

- Rodar lint, build e `git diff --check`.
- Corrigir qualquer erro encontrado.
- Fazer commit e push.
- Bloco futuro: ligar vendas finalizadas ao caixa aberto.
- Bloco futuro: pagamentos divididos no PDV.
- Bloco futuro: incluir fechamento com relatorio/impressao do caixa.

Comandos necessarios para continuar:

```bash
npm.cmd run lint
npm.cmd run build
git diff --check
git add app/pdv/page.tsx services/pos.ts types/domain.ts supabase/sql/032_pos_cash_register.sql CONTINUAR_AQUI.md
git commit -m "feat(pdv): adicionar controle de caixa"
git push origin main
```

## Bloco em andamento - vendas vinculadas ao caixa do PDV

Ultima tarefa concluida:

- Criado script versionado:
  `supabase/sql/033_pos_sales_cash_link.sql`.
- A tabela `pos_sales` recebeu o campo `cash_register_id`.
- A tabela `pos_cash_movements` recebeu o campo `sale_id`.
- Movimentos do caixa agora aceitam:
  - `venda`;
  - `cancelamento_venda`.
- A funcao `create_pos_sale(...)` agora:
  - exige caixa aberto para finalizar venda;
  - grava a venda vinculada ao caixa aberto;
  - registra movimento `venda` no caixa;
  - recalcula o valor esperado do caixa.
- A funcao `cancel_pos_sale(bigint)` agora:
  - devolve estoque como antes;
  - cancela a venda como antes;
  - remove a receita financeira como antes;
  - quando a venda pertence a um caixa ainda aberto, registra
    `cancelamento_venda` e recalcula o esperado.
- A tela do PDV agora bloqueia venda/conversao de orcamento quando nao existe
  caixa aberto.
- O historico de vendas mostra o numero do caixa vinculado quando existir.

Confirmacoes no Supabase:

- Migracao `pos_sales_cash_link` aplicada no projeto `umlwimsjxbhrrjhrofmd`.
- Teste transacional executado com rollback:
  - caixa usado no teste: `#000002`;
  - produto testado: `#000001`;
  - estoque antes da venda: `5`;
  - estoque apos venda: `4`;
  - estoque apos cancelamento: `5`;
  - esperado apos venda: `R$ 204,80`;
  - esperado apos cancelamento: `R$ 200,00`;
  - movimento `venda`: `1`;
  - movimento `cancelamento_venda`: `1`;
  - status final da venda testada: `Cancelada`.

Arquivos modificados:

- `app/pdv/page.tsx`
- `services/pos.ts`
- `types/domain.ts`
- `supabase/sql/033_pos_sales_cash_link.sql`
- `CONTINUAR_AQUI.md`

Pendencias:

- Rodar lint, build e `git diff --check`.
- Corrigir qualquer erro encontrado.
- Fazer commit e push.
- Bloco futuro: pagamentos divididos no PDV.
- Bloco futuro: relatorio/impressao de fechamento de caixa.
- Bloco futuro: dashboard do caixa por periodo e operador.

Comandos necessarios para continuar:

```bash
npm.cmd run lint
npm.cmd run build
git diff --check
git add app/pdv/page.tsx services/pos.ts types/domain.ts supabase/sql/033_pos_sales_cash_link.sql CONTINUAR_AQUI.md
git commit -m "feat(pdv): vincular vendas ao caixa"
git push origin main
```

## Bloco em andamento - pagamentos divididos no PDV

Ultima tarefa concluida:

- Criado script versionado:
  `supabase/sql/034_pos_split_payments.sql`.
- Criada a tabela `pos_sale_payments`.
- Criada a RPC `create_pos_sale_with_payments(bigint, text, jsonb, jsonb)`.
- A RPC reutiliza a venda existente, preservando:
  - baixa de estoque;
  - lancamento financeiro;
  - movimento de venda no caixa;
  - vinculo com caixa aberto.
- A tela do PDV recebeu controle de `Pagamento dividido`.
- Quando ativado, o operador pode informar multiplas formas de pagamento com
  valores individuais.
- A venda dividida so e liberada quando a soma dos pagamentos fecha o total.

Confirmacoes no Supabase:

- Migracao `pos_split_payments` aplicada no projeto `umlwimsjxbhrrjhrofmd`.
- Teste transacional executado com rollback:
  - caixa usado no teste: `#000003`;
  - produto testado: `#000001`;
  - total da venda: `R$ 4,80`;
  - pagamentos registrados: `2`;
  - soma dos pagamentos: `R$ 4,80`;
  - movimento de venda no caixa: `1`;
  - estoque antes da venda: `5`;
  - estoque apos venda: `4`;
  - forma de pagamento no financeiro:
    `PIX: R$ 2,00 + Dinheiro: R$ 2,80`.

Arquivos modificados:

- `app/pdv/page.tsx`
- `services/pos.ts`
- `types/domain.ts`
- `supabase/sql/034_pos_split_payments.sql`
- `CONTINUAR_AQUI.md`

Pendencias:

- Rodar lint, build e `git diff --check`.
- Corrigir qualquer erro encontrado.
- Fazer commit e push.
- Bloco futuro: aplicar pagamento dividido tambem na conversao de orcamento.
- Bloco futuro: relatorio/impressao de fechamento de caixa.
- Bloco futuro: dashboard do caixa por periodo e operador.

Comandos necessarios para continuar:

```bash
npm.cmd run lint
npm.cmd run build
git diff --check
git add app/pdv/page.tsx services/pos.ts types/domain.ts supabase/sql/034_pos_split_payments.sql CONTINUAR_AQUI.md
git commit -m "feat(pdv): adicionar pagamentos divididos"
git push origin main
```

## Bloco em andamento - impressao do fechamento de caixa

Ultima tarefa concluida:

- A aba `Caixa` do PDV recebeu botao `Imprimir caixa`.
- O historico recente tambem recebeu botao `Imprimir` para caixas abertos ou
  fechados.
- Criado documento imprimivel do caixa com:
  - numero e status do caixa;
  - data de abertura;
  - data de fechamento quando existir;
  - data de emissao;
  - abertura;
  - vendas;
  - cancelamentos;
  - suprimentos;
  - sangrias;
  - valor esperado;
  - valor contado;
  - diferenca;
  - totais por forma de pagamento;
  - quantidade de movimentos;
  - tabela completa de movimentacoes;
  - campos de assinatura/conferencia.
- A impressao usa a area `.cash-print-area` para sair limpa, sem sidebar e sem
  controles da tela.
- Nenhum SQL novo foi necessario.

Arquivos modificados:

- `app/pdv/page.tsx`
- `app/globals.css`
- `services/pos.ts`
- `types/domain.ts`
- `CONTINUAR_AQUI.md`

Pendencias:

- Rodar lint, build e `git diff --check`.
- Corrigir qualquer erro encontrado.
- Fazer commit e push.
- Bloco futuro: aplicar pagamento dividido tambem na conversao de orcamento.
- Bloco futuro: dashboard do caixa por periodo e operador.

Comandos necessarios para continuar:

```bash
npm.cmd run lint
npm.cmd run build
git diff --check
git add app/pdv/page.tsx app/globals.css services/pos.ts types/domain.ts CONTINUAR_AQUI.md
git commit -m "feat(pdv): adicionar impressao de caixa"
git push origin main
```

## Bloco em andamento - cadastro rapido de produtos no PDV

Ultima tarefa concluida:

- Criado o componente `QuickProductModal`.
- A aba `Produtos` do PDV recebeu o botao `Produto rapido`.
- O cadastro rapido permite cadastrar produto simples ou varias variacoes em
  linhas.
- Campos principais:
  - produto;
  - categoria;
  - valor de compra;
  - estoque minimo.
- Campos por linha/variacao:
  - tamanho;
  - cor;
  - sabor;
  - codigo;
  - preco de venda;
  - estoque.
- Quando o codigo nao e informado, o sistema gera codigo automatico `PM...`.
- O cadastro rapido usa o mesmo `createProducts` ja existente, sem SQL novo.
- O cadastro completo `ProductModal` foi mantido para edicoes detalhadas.

Arquivos modificados:

- `app/pdv/page.tsx`
- `components/pos/QuickProductModal.tsx`
- `CONTINUAR_AQUI.md`

Pendencias:

- Rodar lint, build e `git diff --check`.
- Corrigir qualquer erro encontrado.
- Fazer commit e push.
- Bloco futuro: permitir importar produtos por planilha CSV.
- Bloco futuro: melhorar entrada de compra para atualizar preco/estoque em lote.

Comandos necessarios para continuar:

```bash
npm.cmd run lint
npm.cmd run build
git diff --check
git add app/pdv/page.tsx components/pos/QuickProductModal.tsx CONTINUAR_AQUI.md
git commit -m "feat(pdv): adicionar cadastro rapido de produtos"
git push origin main
```

## Bloco em andamento - importacao CSV de produtos no PDV

Ultima tarefa concluida:

- Criado o componente `ProductCsvImportModal`.
- A aba `Produtos` recebeu o botao `Importar CSV`.
- O modal permite baixar um modelo CSV.
- O CSV usa separador `;` para funcionar melhor com valores brasileiros.
- Colunas suportadas:
  - `nome`;
  - `categoria`;
  - `codigo`;
  - `tamanho`;
  - `cor`;
  - `sabor`;
  - `preco_custo`;
  - `preco_venda`;
  - `estoque`;
  - `estoque_minimo`.
- A importacao valida campos obrigatorios, precos, estoque inteiro e categorias
  existentes.
- O usuario consegue revisar uma previa antes de salvar.
- Quando o codigo vem vazio, o sistema gera codigo automatico `PM...`.
- A importacao usa o mesmo `createProducts` ja existente, sem SQL novo.

Arquivos modificados:

- `app/pdv/page.tsx`
- `components/pos/ProductCsvImportModal.tsx`
- `CONTINUAR_AQUI.md`

Pendencias:

- Rodar lint, build e `git diff --check`.
- Corrigir qualquer erro encontrado.
- Fazer commit e push.
- Bloco futuro: importar XLSX caso seja necessario usar Excel direto.
- Bloco futuro: melhorar entrada de compra para atualizar preco/estoque em lote.

Comandos necessarios para continuar:

```bash
npm.cmd run lint
npm.cmd run build
git diff --check
git add app/pdv/page.tsx components/pos/ProductCsvImportModal.tsx CONTINUAR_AQUI.md
git commit -m "feat(pdv): adicionar importacao csv de produtos"
git push origin main
```
