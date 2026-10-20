# Ficha e histórico do tutor

Na listagem **Tutores**, clique no nome (no computador ou no celular).
A mesma janela que antes mostrava apenas os pets agora apresenta:

- Nome, código, CPF, telefone, e-mail e endereço cadastrados.
- Todos os pets vinculados, com acesso à ficha do pet quando permitido.
- Último atendimento finalizado que contém banho, por pet.
- Atendimentos em ordem decrescente de data, hora e código.
- Impressão do histórico, incluindo serviços, valores e total.

Campos vazios aparecem como **Não informado**. Ausência de histórico é
diferenciada de erro de carregamento. Um erro impede imprimir uma ficha parcial.

## Origem e significado dos valores

São reutilizadas `tutors`, `pets`, `appointments`, `appointment_services` e
`financial_entries`. Não há migração nem alteração nas políticas de acesso.
As consultas são paginadas e limitadas ao tutor e aos pets vinculados.

O valor do atendimento segue a consulta de recibos existente: último lançamento
de receita com origem `appointment` e referência ao atendimento. Na ausência
dele, usa-se a soma dos preços históricos em `appointment_services`.
Não são consultados preços atuais para preencher lacunas. Zero é um valor válido.

O total inclui somente atendimentos **Finalizado**. Registros sem valor são
indicados e tornam o total parcial. O total não representa pagamentos recebidos.
Os preços individuais podem divergir do lançamento financeiro por ajustes.
Sem serviços detalhados, é exibida a descrição registrada no atendimento.
Atendimentos avulsos sem vínculo com um pet não são atribuídos por nome ao tutor.

## Permissões

A janela exige acesso a tutores. Pets podem ser consultados por esse módulo,
conforme as políticas existentes; o link e o cadastro de pet exigem `pets`.
Histórico: `agenda`, `dashboard`, `pets` ou `clinica`.
Serviços detalhados: `agenda`, `financeiro` ou `recibos`.
Lançamentos financeiros: `financeiro` ou `dashboard`.
As consultas usam a sessão normal do Supabase e continuam sujeitas ao RLS.
Sem permissão, a interface informa a restrição e não executa a consulta.

## Validação

- Testes de ordenação, último banho, preço zero, valor ausente, referência
  financeira, total e permissões.
- Testes do serviço de consulta: filtros, paginação, falhas e perfil restrito.
- Executar `npm test`, lint nos arquivos alterados e `npm run build -- --webpack`.
- Validação manual autenticada: tutor com vários pets; sem pets; sem histórico;
  erro de conexão; fechamento e abertura de outro tutor; perfil restrito;
  largura de 390 px e desktop; prévia de impressão com várias páginas.
- Impressão usa a classe `document-print-area` já existente no sistema.
