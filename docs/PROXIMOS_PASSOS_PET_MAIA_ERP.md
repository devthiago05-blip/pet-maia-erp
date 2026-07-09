# Proximos passos - PET MAIA ERP

Atualizado em: 09/07/2026

## Situacao atual

O PET MAIA ERP ja possui uma base funcional ampla:

- Dashboard;
- Tutores;
- Pets;
- Agenda;
- Servicos;
- Financeiro;
- Recibos;
- PDV;
- Clinica;
- CRM;
- BI;
- Usuarios e permissoes;
- Configuracoes;
- Supabase;
- Vercel.

A Clinica esta bem encaminhada no fluxo principal: prontuario, receitas,
catalogo de medicamentos, modelos de posologia, documentos, vacinas, exames,
retornos e filas operacionais.

## Prioridade 1 - Revisar seguranca e RLS

Objetivo: garantir que usuarios autenticados vejam apenas o que devem ver.

Revisar principalmente:

- `tutors`;
- `pets`;
- `appointments`;
- `services`;
- `financial_entries`;
- tabelas do PDV;
- tabelas clinicas;
- tabelas de CRM e BI quando aplicavel.

Regra recomendada:

- nao depender apenas de `to authenticated`;
- usar politicas ligadas a `public.current_user_can_access('<modulo>')`;
- confirmar que inserts, updates e deletes possuem `using` e `with check`
  coerentes.

Entrega esperada:

- scripts SQL idempotentes;
- teste por usuario com permissao diferente;
- documento com tabelas revisadas.

## Prioridade 2 - Fechamento do PDV

Objetivo: deixar o PDV pronto para operacao diaria completa.

Implementar:

1. abertura de caixa;
2. fechamento de caixa;
3. sangria;
4. suprimento;
5. pagamentos divididos;
6. devolucao parcial;
7. historico detalhado de vendas;
8. integracao de compras com contas a pagar;
9. relatorio de estoque e giro de produtos.

Entrega esperada:

- caixa por usuario e data;
- conciliacao simples;
- logs de cancelamento;
- estoque consistente.

## Prioridade 3 - Documentos clinicos administraveis

Objetivo: permitir que modelos de documentos sejam gerenciados sem alterar
codigo.

Hoje o sistema ja possui documentos clinicos, mas os modelos podem evoluir para
tabela no Supabase.

Criar:

- tabela `clinical_document_templates`;
- campos: tipo, titulo, conteudo, ativo, ordem;
- tela de cadastro/edicao;
- uso dos modelos na modal de documento clinico.

Entrega esperada:

- modelos editaveis pela clinica;
- documentos padronizados;
- menos codigo fixo.

## Prioridade 4 - Clinica mais proxima do VetSmart

Objetivo: aproximar a profundidade clinica sem copiar identidade visual externa.

Melhorias possiveis:

- catalogo clinico com principios ativos mais detalhados;
- alertas por especie;
- observacoes e contraindicacoes cadastradas pela propria clinica;
- protocolos internos;
- modelos de posologia por especie;
- impressao de documentos mais completa;
- area de anexos mais visivel;
- melhor painel resumo do pet;
- filtros mais avancados no prontuario.

Entrega esperada:

- fluxo mais denso e profissional;
- menos digitacao repetida;
- melhor apoio ao veterinario.

## Prioridade 5 - Comunicacao com tutor

Objetivo: facilitar comunicacao pos-atendimento.

Implementar:

- envio facilitado por WhatsApp;
- texto pronto para recibo;
- texto pronto para receita;
- aviso de proxima vacina;
- aviso de retorno;
- lembretes de atraso.

Observacao:

- antes de automatizar envio real, definir ferramenta oficial e custo;
- manter LGPD e consentimento do tutor em mente.

## Prioridade 6 - BI mais completo

Objetivo: transformar dados operacionais em decisao.

Adicionar indicadores:

- faturamento por periodo;
- servicos mais vendidos;
- produtos mais vendidos;
- ticket medio;
- tutores recorrentes;
- pets mais atendidos;
- vacinas previstas;
- retornos atrasados;
- inadimplencia;
- estoque baixo.

Entrega esperada:

- BI visual;
- filtros por periodo;
- graficos claros;
- exportacao futura.

## Prioridade 7 - Testes e qualidade

Objetivo: reduzir risco a cada nova alteracao.

Implementar:

- testes dos services principais;
- testes de regras financeiras;
- testes do cancelamento de venda;
- testes de validacao de receita;
- testes de permissoes quando possivel;
- checklist manual de producao.

Comandos atuais de validacao:

```bash
npm.cmd run lint
npm.cmd run build
git diff --check
```

## Prioridade 8 - Backup e operacao

Objetivo: proteger dados da clinica.

Recomendar:

- rotina de backup Supabase;
- exportacao periodica de dados criticos;
- controle de usuarios administradores;
- revisao de logs;
- documentacao de recuperacao.

## Ordem sugerida de execucao

1. Revisar RLS e permissoes antigas.
2. Fechar PDV com caixa e pagamentos.
3. Transformar modelos de documentos clinicos em catalogo administravel.
4. Evoluir Clinica com protocolos e catalogo clinico avancado.
5. Criar comunicacoes com tutor.
6. Expandir BI.
7. Adicionar testes.
8. Fortalecer backup e rotina operacional.

## Status comparado ao VetSmart

O PET MAIA ERP esta parecido com o VetSmart no fluxo principal de Clinica:

- prontuario por pet;
- receitas;
- medicamentos;
- modelos de posologia;
- documentos;
- exames;
- vacinas;
- retornos;
- filas de acompanhamento.

Ainda nao esta igual em profundidade. O VetSmart possui recursos mais completos
de catalogo medico, referencias, protocolos, automacoes e conteudo clinico.

Para a realidade atual do PET MAIA, o sistema esta funcional e pronto para
evoluir por blocos sem perder estabilidade.
