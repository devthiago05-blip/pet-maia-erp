# Continuar Aqui

- Atualizado em: 09/07/2026
- Branch: `main`
  Ultimo commit funcional: `feat(clinica): adicionar avisos de vacinas`

## Estado confirmado

- `npm.cmd run lint`: aprovado.
- `npm.cmd run build`: aprovado com 19 rotas.
- GitHub: `main` atualizado.
- Vercel: deploy acionado pelo push.
- Supabase usado pelo projeto: `umlwimsjxbhrrjhrofmd`.
- `015_clinical_attachments.sql`: tabela e bucket ja existem no Supabase.
- A tabela `pet_vaccinations` estava com zero registros na ultima verificacao.

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
- Pendente apenas commit e push deste bloco.

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

Pendencias:

- Rodar `npm.cmd run lint`.
- Rodar `npm.cmd run build`.
- Rodar `git diff --check`.
- Se aprovado, commitar e enviar para `main`.

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
