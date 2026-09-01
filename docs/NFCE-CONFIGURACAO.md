# NFC-e e pagamentos integrados

## Estado atual

O módulo foi preparado para desenvolvimento seguro em `mock`. As flags vêm desligadas, nenhuma chamada é feita à SEFAZ ou a uma adquirente real e produção é bloqueada quando a configuração obrigatória não estiver completa.

Fluxo implementado:

`PDV -> PaymentService -> MockSmartPOSAdapter -> venda -> NFCE Service -> XML -> SefazMockAdapter -> armazenamento -> DANFE`

O checkout antigo continua sendo usado quando as flags estiverem desligadas.

## Componentes

- `/fiscal`: indicadores e diagnóstico.
- `/fiscal/produtos`: complemento e validação cadastral fiscal.
- `/fiscal/nfce`: laboratório de emissão MOCK, XML, QR Code e DANFE.
- `/fiscal/xml`: consulta e ZIP mensal/anual para o contador.
- `/fiscal/configuracoes`: dados editáveis da empresa; segredos não são devolvidos ao navegador.
- `/fiscal/pagamentos`: simulações de SmartPOS.
- `/fiscal/logs`: eventos fiscais.
- `lib/nfce`: chave, validação, XML, assinatura MOCK, QR Code, DANFE e adapters.
- `lib/payments`: contrato `PaymentResult`, serviço e adapter MockSmartPOS.

## Banco de testes

A migração `supabase/migrations/20260822023531_nfce_sandbox_foundation.sql` cria:

- `fiscal_product_profiles`;
- `nfce_sequences`, `nfce_documents`, `nfce_items`, `nfce_payments` e `nfce_events`;
- `payment_transactions`;
- buckets privados `fiscal-xml` e `fiscal-danfe`;
- RLS, revogação de acesso direto de `anon/authenticated` e acesso de backend por `service_role`.

Execute essa migração apenas em um projeto Supabase local ou de homologação. Faça backup e revisão antes. Ela não foi aplicada automaticamente ao banco atual.

Os XMLs usam o caminho `nfce/{ambiente}/{ano}/{mes}/{chave}.xml`. O banco conserva XML, protocolo, eventos e metadados para auditoria. Os ZIPs são gerados somente para o período filtrado.

## Variáveis

Copie `.env.example` para o ambiente seguro de desenvolvimento e mantenha inicialmente:

```env
NFCE_ENABLED=false
NFCE_ENV=mock
NFCE_PROVIDER=mock
NFCE_CERT_MODE=mock
PAYMENT_INTEGRATION_ENABLED=false
PAYMENT_PROVIDER=mock
PAYMENT_MOCK_SCENARIO=approved
```

Depois de aplicar a migração no sandbox, habilite uma integração por vez. Para validar pagamento MOCK, ligue `PAYMENT_INTEGRATION_ENABLED=true`. Para emitir NFC-e MOCK automaticamente depois da venda, ligue também `NFCE_ENABLED=true`. Reinicie a aplicação após mudar variáveis.

Certificados, senhas, CSC e tokens de adquirentes pertencem apenas ao backend. PFX/P12, chaves privadas e diretórios de certificados estão ignorados no Git. Nunca use o certificado de desenvolvimento fora do MOCK.

## Testar SmartPOS MOCK

Em `/fiscal/pagamentos`, selecione o cenário desejado. Estão previstos aprovado, negado, cancelado, pendente/timeout, erro de conexão, PIX, crédito e débito. Nenhuma transação real ocorre. O resultado normalizado pode conter transação, autorização, terminal, adquirente e bandeira, mas nunca número completo de cartão, CVV, PIN ou senha.

## Testar NFC-e MOCK

Use `/fiscal/nfce` ou conclua uma venda no PDV com as flags habilitadas. O laboratório valida itens, calcula totais, gera chave com dígito verificador, XML modelo 65, assinatura MOCK, resposta simulada, QR Code e DANFE marcado sem valor fiscal.

O simulador cobre autorização 100, duplicidade 204, schema 215, emitente não habilitado 203, indisponibilidade, timeout, contingência, consulta, reenvio e cancelamento. MOCK não é validação oficial do XSD nem autorização fiscal.

## Cadastro fiscal

O produto mantém perfil fiscal separado. Campos obrigatórios dependem do CRT/regime selecionado. O sistema bloqueia emissão quando faltarem dados e não confirma NCM, CFOP, CST/CSOSN ou alíquotas automaticamente. Qualquer sugestão precisa ser validada pelo contador.

## Backup

Inclua no backup diário:

- tabelas `nfce_*`, `fiscal_product_profiles` e `payment_transactions`;
- buckets privados de XML e DANFE;
- protocolos, eventos de cancelamento e contingência;
- configurações fiscais, sem exportar senhas em texto aberto.

Teste periodicamente a restauração em outro projeto. Preserve XMLs e eventos pelo prazo legal definido pela contabilidade.

## Próxima fase: homologação oficial

Antes de implementar/ativar o adapter oficial, confirme endpoints e schemas vigentes da SEFAZ-CE, obtenha certificado A1 de teste válido, CSC de homologação e credenciamento. O `SefazHomologacaoAdapter` deve substituir o mock pela mesma interface, incluindo assinatura XMLDSig, validação pelos XSDs oficiais, TLS, consulta de recibo e eventos. Essa fase não está ativada e não usa endpoint real.

SmartPOS real também exige credenciais e homologação do provedor. Mercado Pago Point, Stone e TEF devem entrar como adapters, sem alterar o checkout ou o formato interno `PaymentResult`.

## Verificação do projeto

Comandos locais:

```text
npm run lint -- --max-warnings=0
npm test
npm run build
```

