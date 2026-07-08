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
