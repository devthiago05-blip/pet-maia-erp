This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

Produção pública: https://pet-maia-erp.vercel.app

Os links longos e únicos de cada deployment podem exigir autenticação da Vercel.
Para acesso em celulares e computadores externos, use sempre o domínio público.

## Supabase

Execute os scripts da pasta `supabase/sql` no SQL Editor do Supabase, em ordem.

Para o cadastro administrativo de usuários, configure somente no servidor:

```text
SUPABASE_SERVICE_ROLE_KEY
```

Essa chave não pode usar o prefixo `NEXT_PUBLIC_` e deve ser cadastrada também
nas variáveis de ambiente do projeto na Vercel.

## Roadmap

1. Estabilizar o PDV, estoque, vendas e orçamentos.
2. Evoluir relatórios e conciliação financeira.
3. Implementar o módulo Clínica por último, com prontuário, anamnese,
   prescrições, exames, vacinas, internação e documentos clínicos.
