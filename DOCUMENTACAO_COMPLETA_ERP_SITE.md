# PET MAIA ERP — documentação completa e guia de continuidade

> Atualizado em **22/07/2026**, a partir do código no commit **`4f2a519`** da branch `main`.
> Antes de qualquer alteração futura, confirme o commit atual com `git log -1 --oneline`, leia `AGENTS.md` e verifique o código real. Este documento é um mapa do sistema, não substitui a inspeção da versão mais recente.

## 1. Objetivo do sistema

O PET MAIA ERP reúne em uma aplicação web responsiva a operação de pet shop, banho e tosa, clínica veterinária, estoque, compras, PDV, financeiro, CRM e site público. O mesmo sistema funciona em computador e celular e é publicado automaticamente no Vercel.

- Produção: <https://pet-maia-erp.vercel.app>
- Repositório: `https://github.com/devthiago05-blip/pet-maia-erp.git`
- Pasta local principal: `C:\Users\thiago lima\Desktop\pet-maia-erp`
- Branch de produção: `main`
- Banco, autenticação e arquivos: Supabase
- Hospedagem: Vercel

## 2. Tecnologias e versões atuais

- Next.js `16.2.9`, App Router e Turbopack.
- React e React DOM `19.2.4`.
- TypeScript 5.
- Tailwind CSS 4.
- Supabase JS `2.108.2`.
- Lucide React e Hugeicons para ícones.
- Sonner para notificações.
- Tesseract.js, Sharp e pdf-parse para reconhecimento de documentos.
- ZXing para leitura de código de barras pelo celular.
- QR Code e Node Forge para recursos fiscais e criptográficos.

Regra importante do projeto: esta versão do Next.js possui mudanças próprias. Antes de editar código Next.js, ler o guia relevante em `node_modules/next/dist/docs/`, conforme `AGENTS.md`.

## 3. Como o projeto está organizado

```text
app/                  páginas, rotas e APIs do Next.js
components/           componentes de interface separados por módulo
services/             acesso ao Supabase e regras de persistência
types/domain.ts       tipos centrais do domínio
lib/                  formatação, acesso, Supabase e utilitários
supabase/migrations/  migrações recentes versionadas
supabase/sql/         scripts históricos do banco
public/               arquivos públicos
```

Padrão normal de fluxo:

```text
Página/Componente → função em services/ → Supabase → atualização do estado da página
```

Operações que precisam de segredo de servidor usam rotas em `app/api/`. Nunca colocar `SUPABASE_SERVICE_ROLE_KEY` em componente cliente ou variável `NEXT_PUBLIC_*`.

## 4. Variáveis de ambiente

O projeto espera estas variáveis, sem registrar seus valores neste documento:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

As duas primeiras podem ser usadas pelo cliente e dependem de RLS. A `SUPABASE_SERVICE_ROLE_KEY` é exclusiva do servidor, usada principalmente na administração de usuários. Todas devem estar configuradas localmente em `.env.local` e no projeto do Vercel.

## 5. Autenticação e permissões

- Login: `/login`.
- Sessão: Supabase Auth.
- Perfis: `user_profiles`.
- Permissões: `user_permissions`.
- Administração: `/usuarios` e API `/api/users`.
- Módulos são protegidos por `AccessContext`, `lib/access-control.ts` e políticas RLS do Supabase.
- Há perfil administrador e permissões individuais por módulo.
- Limite de desconto no PDV pode depender do perfil do usuário.

Nunca solucionar erro de permissão removendo RLS ou usando chave de serviço no navegador. Corrigir políticas e regras de acesso mantendo o isolamento.

## 6. Navegação e experiência visual

- Menu lateral no computador: `components/layout/Sidebar.tsx`.
- Cabeçalho, busca global e sino: `components/layout/Header.tsx`.
- Navegação inferior no celular: `components/layout/MobileBottomNav.tsx`.
- Busca global localiza tutor, pet e registros relacionados.
- O sino abre diretamente o item clicado, como agendamento, vacina ou título financeiro.
- O visual usa roxo como cor principal (`#8A0EEA`).
- Modais principais usam `erp-modal-overlay` e `erp-modal-panel` de `app/globals.css`.
- Tabelas e listas têm padrões responsivos, cartões no celular e ações com área de toque maior.

Ao criar uma nova página, manter o padrão:

```tsx
<div className="flex min-h-screen overflow-x-hidden bg-slate-50">
  <Sidebar />
  <main className="min-w-0 flex-1 bg-slate-50">
    <Header />
    {/* conteúdo responsivo */}
    <MobileBottomNav />
  </main>
</div>
```

## 7. Dashboard

Rota: `/`.

- Contagem de tutores, pets e agendamentos.
- Agendamentos da semana e concluídos.
- Solicitações pendentes do site.
- Valores a receber.
- Alertas de agendamentos antigos ainda abertos logo ao entrar.
- Para agendamento atrasado, permite reagendar ou excluir.
- Lembretes de banho recorrente e indicadores operacionais.

Serviços principais: `services/dashboard.ts`.

## 8. Tutores

Rota: `/tutors`.

- Cadastro, edição, consulta e exclusão.
- Endereço salvo em maiúsculas.
- Clique no endereço abre rota no Google Maps.
- Telefone possui ação direta para WhatsApp.
- Ao abrir tutor, exibe os pets relacionados.
- Busca e visual responsivo.

Serviço: `services/tutors.ts`.

## 9. Pets

Rotas: `/pets` e `/pets/[id]`.

- Cadastro, edição e exclusão.
- Vínculo obrigatório ou opcional com tutor conforme formulário.
- Foto enviada ao Supabase Storage.
- Foto exibida centralizada com `object-contain`, evitando cortar o animal.
- Lista em cartões no celular e tabela no computador.
- Recorrência de banho; pets existentes foram configurados com referência de 15 dias quando solicitado.
- Perfil completo reúne histórico clínico, vacinas, prevenção, exames, documentos e agenda.
- Cancelar uma edição não deve impedir reabrir o mesmo pet.

Serviço: `services/pets.ts`.

## 10. Serviços, banho e tosa

Rotas: `/services`, `/services/insumos` e `/services/insumos/entrada`.

- Cadastro, edição e exclusão de serviços.
- Insumos de banho e tosa com entradas, saídas, alertas e histórico.
- Compras de insumos podem importar nota ou recibo.
- Pagamento diário de tosador.
- Equipamentos com cadastro, edição, exclusão e serviços/manutenções.
- Movimentos excluídos preservam as regras financeiras relacionadas definidas no serviço.

Serviços: `services/services.ts` e `services/grooming.ts`.

## 11. Agenda

Rota: `/agenda`.

- Novo agendamento, edição, confirmação, finalização e exclusão.
- Status usuais: Pendente, Agendado, Finalizado e Cancelado.
- Pode haver vários serviços vinculados ao mesmo agendamento.
- Finalização gera movimentação financeira e permite recibo.
- Agendamentos anteriores não encerrados geram alerta no acesso ao sistema.
- Recorrências de banho alimentam lembretes.
- No celular a agenda usa cartões; no computador usa tabela.

Serviço: `services/appointments.ts`.

Cuidados ao alterar: manter sincronizados agendamento, serviços associados e título financeiro. Ao marcar título do sino como pago, a mudança deve refletir na tela Financeiro porque ambos usam `financial_entries`.

## 12. Financeiro

Rota: `/financeiro`.

- Receitas e despesas.
- Pendentes e pagos.
- Criação, edição, recebimento e exclusão.
- Vínculo possível com tutor, pet, agenda, compras, banho e tosa ou PDV.
- Lançamentos recorrentes e geração de parcelas.
- Filtros, totais e impressão.
- Notificações direcionadas abrem o título específico.

Serviço: `services/financial.ts`.

## 13. Recibos e relatórios

Rotas: `/receipts` e `/relatorios`.

- Recibos de atendimentos e vendas.
- Impressão com áreas específicas (`receipt-print-area`, `cash-print-area` e `document-print-area`).
- Relatórios financeiros, operacionais, estoque baixo e movimentações.
- Alterações visuais globais não podem quebrar estilos `@media print` de `app/globals.css`.

## 14. PDV

Rota: `/pdv`.

Submódulos:

- Venda.
- Caixa.
- Produtos.
- Balanço de estoque.
- Compras.
- Orçamentos.
- Histórico de vendas.

### Venda

- Busca por nome, SKU e código de barras.
- Leitura de código pela câmera do celular.
- Seleção de tutor ou consumidor sem cadastro.
- Carrinho, quantidade, desconto, acréscimo e motivo.
- Pagamento simples ou dividido em várias formas.
- Quando o valor informado não cobre o total, pode abrir automaticamente outra forma.
- Troco pode ser entregue em dinheiro ou PIX.
- Vendas podem ser suspensas e recuperadas.
- Gera recibo/comprovante.
- Permite devolução e cancelamento conforme fluxo existente.

### Caixa

- Abertura, suprimento, sangria e fechamento.
- Conferência do valor esperado e diferença.
- Relatório e impressão do caixa.

### Orçamentos

- Criar, editar e excluir.
- Converter orçamento em venda.
- Validade configurável.
- Pagamento no momento da conversão.

Serviço central: `services/pos.ts`.

## 15. Produtos e estoque

Rotas: `/pdv` na aba Produtos e `/estoque`.

- Produto com nome, categoria, SKU, código de barras, custo, venda, estoque e mínimo.
- Produto pode ser ativo ou inativo; itens inativos continuam consultáveis por filtro.
- Exclusão normalmente é arquivamento lógico (`ativo = false`) para preservar histórico.
- Exclusão em lote também arquiva.
- Fotos de acessórios do site podem vir do cadastro de produto ou do módulo Site.
- Importação por CSV.
- Sugestão e consulta de dados por código de barras.
- Dados fiscais ficam recolhidos e não impedem cadastro; o sistema avisa que são necessários para emissão fiscal.

### Unidades e conversões

- Compra em caixa e venda por cartela/unidade.
- Ração a granel e venda fracionada.
- Campos: `purchase_unit`, `sale_unit` e `units_per_purchase`.
- Ao registrar entrada, o estoque deve considerar a conversão.

### Balanço

- Contagem geral de vários produtos.
- Pode ser salvo como rascunho.
- Ao finalizar, substitui o saldo atual pela quantidade contada e registra movimentos.

### Estoque baixo e reposição

- Compara estoque atual e mínimo.
- Considera vendas dos últimos 30 dias.
- Mostra reposição sugerida.
- Lista todos os itens baixos e prepara pedido de compra.

Serviços: `services/pos.ts` e `services/stock.ts`.

## 16. Compras e importação de notas

Tela: `/pdv`, aba Compras.

- Entrada manual ou importação de XML, PDF e foto.
- Endpoint: `/api/purchases/recognize`.
- XML lê campos estruturados da NF-e.
- PDF extrai texto.
- Foto é preparada com Sharp e lida por OCR com Tesseract.
- Editor de imagem permite girar, recortar e melhorar a foto antes do OCR.
- Há limite de arquivo e tratamento de timeout/erro.
- O arquivo original é arquivado no Storage `purchase-documents` e relacionado à compra.
- Duplicidade é detectada por hash antes do arquivamento.
- XMLs e documentos ficam disponíveis na área de compras.

### Associação de itens

- Cada item reconhecido deve ser associado a um produto do ERP ou cadastrado rapidamente.
- Busca por nome, SKU, código de barras, categoria e variação.
- Código de barras ou SKU exato associa automaticamente.
- Descrição semelhante apenas sugere; não deve associar automaticamente.
- Associação confirmada fica em `purchase_item_mappings` e é reaproveitada.
- As três sugestões mais prováveis aparecem primeiro.

### Custos e fornecedores

- Mostra diferença entre custo atual e custo da nota, sem alterar automaticamente o cadastro.
- Exibe histórico do produto: última compra, menor preço, fornecedor e variação.
- Comparativo geral mostra compras, total, ticket médio, produtos e melhores custos por fornecedor.
- Pagamento da compra aceita divisão em várias formas.
- O estoque só é atualizado quando a compra/recebimento correto é concluído.

Arquivos principais:

- `components/pos/PurchaseModal.tsx`
- `components/purchases/PurchaseDocumentImporter.tsx`
- `components/purchases/PurchaseImageEditor.tsx`
- `services/purchase-recognition.ts`
- `app/api/purchases/recognize/route.ts`

## 17. Clínica veterinária

Rotas: `/clinica`, `/pets/[id]` e receita pública `/receita/[token]`.

- Prontuário e anamnese.
- Peso, temperatura, queixa, alergias, medicamentos, diagnóstico e conduta.
- Ao abrir uma nova consulta, mostra peso, temperatura, alergias e medicamentos da consulta anterior; alergias e medicamentos podem ser copiados com confirmação do veterinário.
- Alertas clínicos permanentes por paciente: alergia, doença crônica, medicação contínua, cuidado especial ou outro, com gravidade informativa, atenção ou crítica.
- Triagem ampliada: frequência cardíaca, frequência respiratória, mucosas, hidratação e escala de dor de 0 a 10.
- Retorno e confirmação de retorno.
- Prescrições com item simples ou fórmula, dosagem, frequência, duração e instruções.
- Catálogo de medicamentos e modelos de dosagem.
- Receita compartilhável por link/token e reemissão auditada.
- Vacinas e próximas doses.
- Controle de antiparasitários.
- Exames, etapas, resultados e anexos.
- Documentos clínicos e modelos.
- Tarefas da equipe veterinária.
- Internação, evolução, alta e agenda de medicamentos administrados.
- Perfis profissionais com CRMV, UF, MAPA e assinatura.
- Consentimentos clínicos vinculados ao pet, com 20 modelos editáveis: exames de risco, terapêutica, cirurgia, anestesia/sedação, internação, transfusão, odontologia, reprodução/obstetrícia, isolamento, eutanásia, retirada/destinação do corpo, necropsia, doação para ensino, pesquisa clínica, retirada sem alta, recusa de tratamento, transporte e uso de imagem/dados. O tutor assina na tela com dedo, caneta ou mouse; o sistema preserva o texto aceito, responsável, documento opcional, data/hora e profissional, permitindo impressão ou PDF posterior. Os modelos devem ser revisados pelo responsável técnico e adaptados ao caso concreto.
- Cada termo também possui a opção **Assinar com caneta**, que gera uma página pronta para impressão com identificação do paciente e tutor, CPF/RG, local/data e campos separados para assinatura manual do responsável e do médico-veterinário com carimbo/CRMV.

Serviço: `services/clinical.ts`.

### Associação de itens na entrada de produtos

Ao importar XML, PDF ou foto de uma nota, cada item não associado oferece **Cadastro rápido** e **Cadastro completo**. O cadastro completo permite definir unidade de compra (ex.: CAIXA/PACK), unidade de venda (ex.: UN) e quantidade de unidades de venda por embalagem. Exemplo: `1 PACK = 12 UN`; ao registrar a entrada de 3 packs, o estoque recebe 36 unidades disponíveis para venda no PDV.

Para produtos comprados em pack e vendidos separadamente, o estoque é controlado pela unidade de venda. Exemplo: em `1 PACK = 15 SACHÊS`, a entrada de um pack adiciona 15 sachês. A lista de produtos e o seletor do PDV exibem simultaneamente packs e sachês, identificando o pack aberto. Cada sachê vendido reduz o saldo e o pack somente chega a zero quando o 15º sachê é vendido.

O mesmo controle atende medicamentos e outras embalagens fracionadas, como `CAIXA → CARTELA`, `CAIXA → COMPRIMIDO` e `FARDO → PACOTE`. O cadastro oferece atalhos para essas combinações. A unidade amigável usada no estoque e no PDV é separada da unidade comercial fiscal, que permanece `UN` para manter compatibilidade com a NFC-e.

Dados clínicos são sensíveis. Manter autenticação, RLS, trilha de reemissão e acesso mínimo necessário.

## 18. CRM e BI

Rotas: `/crm` e `/bi`.

- CRM registra contatos e interações com tutores.
- BI reúne indicadores e análises do negócio.
- Serviços: `services/crm.ts` e consultas das páginas/serviços de dashboard e financeiro.

## 19. Site

Rota administrativa: `/site`.

- Configura o conteúdo público e imagens.
- Fotos de pets do site são gerenciadas por `services/site-pet-images.ts`.
- Acessórios/produtos exibidos no site são controlados por `services/site-accessories.ts`.
- Imagens ficam no Supabase Storage.
- Produto precisa estar ativo e marcado/configurado conforme as regras de visibilidade do serviço.
- No celular, testar imagens, cards, textos, botões e formulários em largura aproximada de 390 px.
- Solicitações de agendamento vindas do site entram como pendentes e aparecem no dashboard/sino.

Ao perguntar “onde adicionar fotos”, verificar primeiro `/site`; imagens de produto podem também depender do cadastro do produto no PDV.

## 20. Fiscal e NFC-e

- Configuração em `/settings` e API `/api/fiscal/config`.
- Estrutura aceita certificado digital e informações de CSC/CSC ID.
- Credenciais fiscais devem permanecer protegidas no servidor.
- Produtos possuem campos como NCM, CFOP, origem, CSOSN e unidade comercial.
- Tributação não é obrigatória para salvar produto, mas é necessária para emitir documento fiscal.
- Existe preparação de manual/configuração e estrutura de XML, porém emissão fiscal em produção deve ser validada com SEFAZ, certificado, credenciamento, numeração, série, ambiente e regras do estado.

Não afirmar que uma NFC-e foi autorizada apenas porque o formulário salvou. Confirmar resposta real da SEFAZ, protocolo e XML autorizado.

## 21. Supabase: dados, RLS e arquivos

O banco usa tabelas públicas com RLS e funções RPC para operações atômicas. Exemplos de áreas:

- `tutors`, `pets`, `appointments`, `appointment_services`.
- `financial_entries`, `financial_recurring_rules`.
- `products`, `product_categories`, `product_stock_movements`, `product_batches`.
- `product_purchases`, `product_purchase_items`, `product_purchase_payments`.
- `purchase_orders`, itens e recebimentos.
- `pos_sales`, itens, pagamentos, orçamentos, caixa e movimentos.
- `clinical_*`, vacinas, prevenção, tarefas, exames, internações e documentos.
- `grooming_*`.
- `purchase_item_mappings` e `purchase_documents`.
- `user_profiles` e `user_permissions`.

Migrações recentes estão em `supabase/migrations/`. Para qualquer mudança de banco:

1. Ler as instruções atuais do Supabase.
2. Conferir schema e políticas existentes.
3. Criar migração versionada.
4. Manter RLS em tabelas expostas.
5. Não expor service role.
6. Testar consulta ou RPC real após aplicar.
7. Rodar advisors quando disponível.

Buckets relevantes incluem fotos de pets, imagens do site, anexos clínicos e `purchase-documents`.

## 22. Regras importantes de negócio

- Endereço de tutor sempre em maiúsculas.
- Exclusão de produto deve preservar compras e vendas; preferir arquivamento lógico.
- Testes automatizados não devem criar cadastros falsos no banco de produção.
- Descrição semelhante de nota é sugestão; só código exato ou associação salva pode selecionar automaticamente.
- Diferença de custo é apenas informativa, salvo decisão explícita futura.
- Recebimento de compra/pedido é o evento que deve atualizar estoque.
- Conversão de caixa/cartela/granel deve respeitar unidades por compra.
- Notificação deve abrir o registro específico, não apenas a página geral.
- Mudanças financeiras precisam refletir em todas as telas que leem `financial_entries`.
- Sempre validar responsividade no celular.
- Quando uma alteração funcionar, enviar para GitHub/Vercel.
- Ao final de cada entrega, informar a próxima melhoria recomendada.

## 23. Fluxo recomendado para qualquer alteração

1. Confirmar a solicitação e localizar o código com `rg`.
2. Ler `AGENTS.md`.
3. Para Next.js, ler o guia relevante em `node_modules/next/dist/docs/`.
4. Para Supabase, verificar documentação atual, schema, RLS e migrações.
5. Verificar `git status` e preservar alterações do usuário.
6. Implementar com mudanças pequenas e coerentes.
7. Executar:

```powershell
npm.cmd run lint
npm.cmd run build
```

8. Testar visualmente desktop e celular quando houver interface.
9. Não inserir dados falsos de teste no banco real.
10. Conferir `git diff --check` e `git diff`.
11. Commitar e enviar:

```powershell
git add <arquivos>
git commit -m "tipo: descricao objetiva"
git push origin main
```

12. Confirmar a URL pública do Vercel com status HTTP 200 e, para mudanças visuais, conferir a tela publicada.

## 24. Como executar localmente

```powershell
cd "C:\Users\thiago lima\Desktop\pet-maia-erp"
npm.cmd install
npm.cmd run dev
```

Abrir `http://localhost:3000`. Para build de produção:

```powershell
npm.cmd run lint
npm.cmd run build
npm.cmd start
```

O build pode precisar de internet para fontes e dependências externas.

## 25. Diagnóstico rápido

### Alteração não apareceu no Vercel

- Confirmar `git status` e `git log -1`.
- Confirmar `git push origin main`.
- Aguardar o deployment.
- Abrir o domínio público, não uma URL privada de preview.
- Atualizar a página sem cache somente depois de proteger dados não salvos.

### Supabase retorna vazio sem erro

- Conferir sessão do usuário.
- Conferir política SELECT.
- Em UPDATE, lembrar que RLS também precisa permitir SELECT.
- Conferir se tabela está exposta à Data API e se há grants apropriados.

### Foto/PDF da nota não reconhece

- Conferir tamanho e tipo.
- Melhorar recorte, rotação, iluminação e foco.
- Conferir timeout da API.
- XML de NF-e é a fonte mais confiável.
- A interface deve sempre mostrar sucesso ou erro, nunca parar silenciosamente.

### Layout móvel cortado

- Testar largura de 390 px.
- Verificar `min-w-0`, `overflow-x-hidden`, barras fixas e espaço inferior da navegação.
- Preferir cartões móveis a tabelas largas.
- Modais devem usar as classes `erp-modal-*`.

## 26. Estado atual e próximas evoluções possíveis

O sistema está operacional e avançado. As principais áreas já funcionam; a continuidade deve priorizar estabilização, automação segura e validação no uso diário.

Melhorias candidatas:

1. Separar pedido de reposição automaticamente por fornecedor com melhor custo.
2. Refinar estados vazios, filtros e buscas de todos os módulos.
3. Ampliar testes automatizados sem escrever no banco real.
4. Auditoria de permissões e RLS.
5. Validar NFC-e ponta a ponta em homologação e depois produção.
6. Monitoramento de erros e desempenho.
7. Backup e procedimento de restauração do Supabase.

## 27. Texto para iniciar outro chat

Copie este bloco junto com o documento:

```text
Trabalhe no PET MAIA ERP localizado em C:\Users\thiago lima\Desktop\pet-maia-erp.
Leia primeiro AGENTS.md e este documento completo. Depois confira a situação real com
git status, git log -1, package.json e os arquivos envolvidos. O código atual é a fonte
de verdade; se este documento divergir, use o código e atualize a documentação.

Antes de alterar APIs ou convenções do Next.js, leia o guia correspondente em
node_modules/next/dist/docs/. Para qualquer tarefa com Supabase, verifique a documentação
atual, o schema, as migrações e as políticas RLS. Nunca exponha service role e nunca crie
dados falsos no banco de produção durante testes.

Implemente a solicitação, rode npm.cmd run lint e npm.cmd run build, teste desktop e
celular quando houver interface, preserve mudanças existentes do usuário e publique na
branch main para o Vercel quando tudo estiver correto. No final informe o que foi feito,
os testes, se foi publicado e qual a próxima melhoria recomendada.
```

## 28. Manutenção deste documento

Depois de uma mudança relevante:

- Atualizar data e commit no início.
- Atualizar o módulo correspondente.
- Registrar novas variáveis apenas pelo nome, nunca pelo valor.
- Atualizar migrações, buckets, regras e fluxos afetados.
- Manter a seção do próximo chat coerente com as regras vigentes.
