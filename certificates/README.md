# Certificados NFC-e

Estrutura local esperada:

```text
certificates/
├── development/
│   └── mock-certificate.pfx
└── production/
```

Os diretórios e arquivos de certificados são ignorados pelo Git. Nunca versione
PFX/P12, senha, chave privada, CSC ou token CSC.

O certificado de desenvolvimento serve exclusivamente para testes locais e não
possui validade fiscal. Em Vercel, credenciais reais devem ser fornecidas por um
gerenciador de segredos ou armazenamento privado, nunca pelo repositório.
