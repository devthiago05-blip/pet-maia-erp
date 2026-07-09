# Manual de uso - PET MAIA ERP

Atualizado em: 09/07/2026

## Visao geral

O PET MAIA ERP centraliza a rotina da Clinica Veterinaria Pet Maia em um unico
sistema: tutores, pets, agenda, servicos, financeiro, recibos, PDV, clinica,
CRM, BI, usuarios e configuracoes.

O sistema foi construido para uso no computador e no celular. No celular, use o
menu lateral recolhivel para acessar os modulos.

## Acesso ao sistema

1. Abra o sistema pela URL publicada na Vercel.
2. Informe e-mail e senha do usuario.
3. Apos entrar, use o menu lateral para navegar pelos modulos.

Se algum modulo nao aparecer ou nao abrir, verifique as permissoes do usuario
na tela `Usuarios`.

## Dashboard

O Dashboard mostra uma visao rapida da operacao:

- resumo financeiro;
- ultimos recebimentos;
- informacoes recentes da rotina;
- atalhos para acompanhar o movimento do dia.

Use o Dashboard para verificar rapidamente se ha movimentacao financeira,
agendamentos ou informacoes que precisam de acompanhamento.

## Tutores

A tela `Tutores` guarda os dados dos responsaveis pelos pets.

Fluxo recomendado:

1. Cadastre o tutor antes do pet.
2. Informe nome, telefone, e-mail e endereco.
3. Mantenha o telefone atualizado para contato, envio de recibos e comunicacoes.
4. Use a busca para localizar rapidamente um tutor ja cadastrado.

O endereco do tutor tambem pode ser usado nos documentos clinicos e receitas.

## Pets

A tela `Pets` centraliza os animais cadastrados.

Fluxo recomendado:

1. Cadastre o pet vinculado ao tutor correto.
2. Informe nome, especie, raca, sexo, idade e porte.
3. Abra a ficha do pet para ver historico, clinica, vacinas, exames, documentos,
   agenda e financeiro relacionados.

A ficha do pet e o ponto principal para acompanhar o historico individual.

## Agenda

A tela `Agenda` organiza os atendimentos e servicos marcados.

Use para:

- cadastrar novos agendamentos;
- acompanhar data e horario;
- vincular tutor e pet;
- informar o servico;
- acompanhar status do atendimento.

Por enquanto, o fluxo nao exige horario final. O controle principal e feito por
data, horario inicial, pet, tutor, servico e status.

## Servicos

A tela `Servicos` guarda os servicos oferecidos pela clinica.

Use para cadastrar e revisar:

- banho;
- tosa;
- consulta;
- vacinas;
- outros servicos cobrados.

Mantenha os valores atualizados, pois eles ajudam no financeiro, recibos,
agendamentos e PDV quando aplicavel.

## Financeiro

A tela `Financeiro` acompanha entradas, vencimentos e recebimentos.

Boas praticas:

- revise a descricao antes de salvar;
- confira tutor e pet quando o registro estiver relacionado a atendimento;
- use filtros para localizar valores por data, status ou contexto;
- mantenha baixas e recebimentos em dia.

Quando uma venda do PDV e cancelada corretamente, o sistema deve manter a
consistencia da operacao e devolver o estoque conforme fluxo implementado.

## Recibos

A tela `Recibos` permite consultar e emitir comprovantes.

Use quando precisar:

- comprovar pagamento;
- enviar informacoes ao tutor;
- revisar servicos prestados;
- conferir valores.

No fluxo com PIX, copie apenas o codigo copia e cola quando for enviar pelo
WhatsApp, sem misturar com textos explicativos.

## PDV

O PDV e usado para produtos, orcamentos e vendas.

Fluxo de produto:

1. Cadastre o produto.
2. Defina categoria.
3. Use variacoes quando o mesmo produto tiver tamanho, cor ou sabor.
4. Controle preco e estoque por variacao quando aplicavel.
5. Use codigo interno do produto para facilitar busca e organizacao.

Fluxo de venda:

1. Selecione produto e variacao correta.
2. Informe quantidade.
3. Confira subtotal e total.
4. Finalize a venda.
5. Se precisar excluir/cancelar venda, use o botao correto para devolver o
   produto ao estoque.

Fluxo de compra:

1. Registre fornecedor.
2. Informe produtos comprados.
3. Atualize custo, quantidade e estoque.
4. Quando houver contas a pagar, vincule a compra ao financeiro.

## Clinica

A tela `Clinica` e o hub operacional da area veterinaria.

Ela inclui:

- selecao de tutor e pet para documentos e receitas;
- catalogo de medicamentos;
- fila de retornos;
- avisos de vacinas;
- filtros rapidos de atrasados, hoje e proximos dias;
- lista de pacientes;
- acesso direto ao prontuario do pet.

### Prontuario do pet

Na ficha do pet, aba `Clinica`, registre consultas com:

- profissional;
- data;
- peso;
- temperatura;
- queixa principal;
- anamnese;
- alergias;
- medicamentos em uso;
- diagnostico;
- conduta;
- data de retorno.

### Receituario

O receituario permite:

- cadastrar medicamentos industrializados ou manipulados;
- definir tipo de receita;
- informar via, quantidade, forma, posologia, duracao e instrucoes;
- agrupar itens em uma receita;
- emitir e imprimir;
- compartilhar receita emitida por link publico;
- reemitir link com historico.

Antes de imprimir ou compartilhar, o sistema valida pendencias importantes,
como CRMV, quantidade em receitas especiais e dados obrigatorios do item.

### Catalogo da clinica

Use o `Catalogo da clinica` para cadastrar medicamentos usados no receituario.

Campos disponiveis:

- nome;
- principio ativo;
- farmacia padrao;
- forma padrao;
- via padrao;
- observacoes;
- favorito.

Arquivar um medicamento remove ele do catalogo ativo sem apagar o historico.

### Vacinas

Registre vacinas na ficha do pet com:

- nome da vacina;
- fabricante;
- lote;
- data da aplicacao;
- proxima dose;
- profissional;
- observacoes.

A tela `Clinica` mostra vacinas atrasadas, vencendo hoje e proximas doses em
ate 30 dias.

### Exames

Use a area de exames para registrar:

- exame solicitado;
- data de solicitacao;
- coleta;
- resultado;
- laboratorio;
- status;
- observacoes.

## CRM

O CRM ajuda a acompanhar contato com tutores.

Use para:

- registrar historico de contato;
- acompanhar proximas acoes;
- manter relacionamento com clientes;
- planejar retornos comerciais ou pos-atendimento.

## BI

O BI mostra indicadores visuais do negocio.

Use para acompanhar:

- receitas;
- comparativos;
- evolucao por periodo;
- desempenho geral da operacao.

Os graficos ajudam a enxergar tendencias sem depender apenas de totais.

## Usuarios e permissoes

A tela `Usuarios` permite controlar quem acessa cada modulo.

Boas praticas:

- crie um usuario por pessoa;
- evite compartilhar senha;
- libere apenas os modulos necessarios;
- revise permissoes quando alguem mudar de funcao;
- mantenha administradores restritos.

## Configuracoes

Use `Configuracoes` para manter dados da clinica e do profissional:

- nome da clinica;
- telefone;
- endereco;
- chave PIX;
- CRMV;
- UF do CRMV;
- registro MAPA quando aplicavel;
- texto de assinatura.

Esses dados podem aparecer em recibos, documentos e receitas.

## Rotina recomendada

### Inicio do dia

1. Verifique agenda.
2. Confira fila de retornos.
3. Confira vacinas em atencao.
4. Revise pendencias financeiras.

### Durante atendimentos

1. Atualize tutor e pet.
2. Registre atendimento clinico.
3. Emita receita ou documento quando necessario.
4. Registre financeiro ou venda.
5. Envie recibo ao tutor quando aplicavel.

### Final do dia

1. Confira vendas do PDV.
2. Confira financeiro.
3. Revise agendamentos pendentes.
4. Confirme se nao ha registros incompletos.

## Cuidados importantes

- Nao exclua dados sem necessidade.
- Sempre confira tutor e pet antes de salvar atendimento.
- Antes de enviar receita ou recibo, revise dados do tutor, pet e valores.
- Mantenha o catalogo de medicamentos organizado.
- Em caso de erro de permissao, confira o usuario e as regras do modulo.
