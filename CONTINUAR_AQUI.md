# Continuar Aqui

- Atualizado em: 08/07/2026
- Branch: `main`
  Ultimo commit funcional: `92bce99 feat(clinica): finalizar perfil e auditoria`

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
