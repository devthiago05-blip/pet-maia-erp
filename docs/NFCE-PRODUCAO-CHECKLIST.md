# Checklist NFC-e para produção

Produção somente pode ser considerada após MOCK e homologação oficial concluídos e aprovação expressa do responsável e da contabilidade.

## Solicitar à contabilidade

- [ ] CNPJ, razão social, nome fantasia e endereço conferidos.
- [ ] Inscrição Estadual e situação cadastral ativa no Ceará.
- [ ] CRT/regime tributário e enquadramento da empresa.
- [ ] Série e próximo número da NFC-e, considerando documentos já emitidos.
- [ ] CSC de produção e respectivo ID, obtidos no portal da SEFAZ-CE.
- [ ] CSC e ID separados para homologação, quando aplicável.
- [ ] Regras validadas de NCM, CEST, CFOP, CST ou CSOSN, origem, ICMS, PIS, COFINS e IPI por produto/operação.
- [ ] Benefícios fiscais, FCP, desoneração, monofásico e códigos específicos quando aplicáveis.
- [ ] Regras para devolução, cancelamento, inutilização, contingência e trocas.
- [ ] Prazo e processo de guarda/entrega mensal dos XMLs.
- [ ] Responsável formal pela validação final do cadastro fiscal.

## Certificado e credenciamento

- [ ] Certificado ICP-Brasil A1 emitido para o CNPJ correto.
- [ ] Arquivo PFX/P12 armazenado em cofre/volume privado, nunca no Git ou frontend.
- [ ] Senha armazenada no gerenciador de segredos do backend.
- [ ] Validade, cadeia e assinatura testadas; alerta de vencimento configurado.
- [ ] Empresa credenciada para NFC-e na SEFAZ-CE.
- [ ] CSC/ID de homologação e produção guardados separadamente.

## Homologação oficial

- [ ] Adapter oficial implementado com endpoints e XSDs vigentes.
- [ ] Autorização, rejeição, duplicidade e consulta testadas.
- [ ] Cancelamento e inutilização testados.
- [ ] Contingência e reenvio testados sem duplicar numeração.
- [ ] QR Code e DANFE conferidos.
- [ ] Pagamentos e troco conferidos no XML.
- [ ] PIX, crédito, débito, dinheiro, voucher e pagamentos mistos testados.
- [ ] SmartPOS real homologado pelo provedor escolhido.
- [ ] Contabilidade aprovou XMLs e DANFEs de homologação.

## Infraestrutura e segurança

- [ ] Banco de produção tem migração revisada, backup e plano de rollback.
- [ ] RLS e permissões do `service_role` revisadas.
- [ ] Buckets de XML/DANFE são privados.
- [ ] Nenhum certificado, CSC, senha, token ou chave consta no Git ou bundle do navegador.
- [ ] Logs ocultam segredos e dados desnecessários de clientes/cartões.
- [ ] Backups automáticos e restauração foram testados.
- [ ] Alertas cobrem SEFAZ indisponível, rejeições frequentes, certificado vencendo e numeração duplicada.

## Ativação controlada

- [ ] Janela de ativação e responsável definidos.
- [ ] Configuração validada por rotina fail-closed antes da primeira emissão.
- [ ] Primeiro habilitar homologação com `NFCE_PROVIDER=sefaz`; nunca apontar MOCK para produção.
- [ ] Somente após aprovação, configurar segredos no backend e alterar `NFCE_ENV=producao`.
- [ ] Habilitar `NFCE_ENABLED=true` por último.
- [ ] Emitir e conferir a primeira nota acompanhada pela contabilidade.

## Rollback

- [ ] Desativar `NFCE_ENABLED=false` sem interromper o checkout existente.
- [ ] Desativar `PAYMENT_INTEGRATION_ENABLED=false` para retornar ao pagamento atual.
- [ ] Não reutilizar números nem apagar XML/protocolo após falha.
- [ ] Consultar a SEFAZ antes de reenviar documento com resultado incerto.
- [ ] Registrar incidente, preservar logs/eventos e acionar contabilidade/suporte fiscal.

