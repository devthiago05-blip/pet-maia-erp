# Analise do Receituario VetSmart

Analise visual realizada em 08/07/2026, usando a conta autenticada do usuario e
sem salvar dados de teste no VetSmart.

O estudo detalhado cobre os fluxos visiveis de clinica, prontuario, retornos,
agenda, vacinas e receituario. Internacao e recursos bloqueados pelo plano nao
foram considerados integralmente analisados.

## Fluxo observado

1. O prontuario agrupa prescricoes emitidas por paciente e permite filtrar por
   periodo e ordenar os registros.
2. Uma nova prescricao pode combinar varios produtos industrializados e
   formulas manipuladas no mesmo documento.
3. Produtos industrializados registram medicamento, tipo de receita, farmacia,
   via, quantidade e posologia.
4. Formulas manipuladas registram componentes e concentracoes, forma
   farmaceutica, quantidade, unidade e posologia automatica ou em texto livre.
5. Cada item aparece em um cartao com resumo, edicao individual e exclusao.
6. A revisao do documento mostra tipo, quantidade de industrializados e
   manipulados e data da prescricao.
7. Antes da emissao e possivel escolher se data, unidades e foto do animal
   aparecem no documento.
8. A configuracao permite revisar assinatura, CRMV, estado e registro MAPA.
9. Existem previa de impressao e previa digital antes de emitir o documento.
10. O documento impresso separa animal e responsavel, agrupa itens por via,
    mostra farmacia, quantidade, posologia e instrucoes gerais.
11. Prescricoes emitidas podem ser reemitidas, editadas, visualizadas e
    excluidas.

## Implementado no PET MAIA

- Industrializado e manipulado no mesmo modelo de dados.
- Varios itens agrupados em uma receita com rascunho, emissao e historico.
- Instrucoes gerais salvas no documento e revisao antes da impressao.
- Receita simples, controle especial e antimicrobiano.
- Farmacia veterinaria, humana e de manipulacao.
- Via, quantidade, unidade, forma farmaceutica e composicao.
- Dose, frequencia, duracao e orientacoes adicionais.
- Sugestoes de frequencia, via, unidade e forma, sem bloquear texto livre.
- Catalogo pesquisavel por medicamento e principio ativo, com favoritos.
- Modelos de posologia criados e selecionados pela propria clinica.
- Multiplos componentes estruturados nas formulas manipuladas.
- Previa do item antes de salvar.
- Edicao e exclusao individual com confirmacao visual.
- Cartoes resumidos no prontuario.
- Documento impresso com dados estruturados, tipo documental, cidade da
  configuracao, quantidade, farmacia, via, composicao e assinatura.
- Perfil de assinatura com UF do CRMV e registro MAPA.
- Link publico revogavel por token para previa digital e impressao.
- Compatibilidade com prescricoes antigas.

## Proximos blocos

1. Criar historico de reemissao e rotacao de links compartilhados.
2. Adicionar regras documentais especificas para antimicrobianos e controle
   especial, sem substituir validacao profissional ou juridica.

## Limites intencionais

- O PET MAIA nao copia marca, codigo ou elementos proprietarios do VetSmart.
- A interface mantem a identidade visual Pet Maia.
- Nao foram cadastrados medicamentos reais automaticamente nem criadas regras
  clinicas que possam sugerir conduta sem revisao do veterinario.
