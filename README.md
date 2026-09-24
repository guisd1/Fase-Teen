# Template de loja (Fase Teen / Ciranda Cirandinha)

Loja virtual em **Next.js + TypeScript**: catálogo, carrinho, frete pelo Melhor Envio, retirada na loja, finalização pelo WhatsApp e newsletter pela Brevo.

O mesmo código publica várias lojas. Cada loja é **um projeto separado na Vercel** que aponta para este repositório e tem as próprias variáveis de ambiente: banco, Redis e chaves.

## Estrutura

```
src/stores/            ← ARQUIVO CENTRAL DE MARCA (um por loja)
  types.ts             formato da configuração
  fase-teen.ts         nome, cores, fontes, logo, textos, contatos, páginas institucionais
  ciranda-cirandinha.ts
  index.ts             escolhe a loja pela variável STORE
src/db/
  schema.ts            tabelas do banco (produtos)
  products.ts          consultas usadas pelo site e pelo frete
  seed/<loja>.ts       produtos iniciais de cada loja
src/app/               páginas e rotas de API (/api/frete, /api/newsletter, /api/melhor-envio/*)
src/components/        componentes da vitrine (cards, carrinho, checkout...)
public/                imagens estáticas (coloque o logo em public/brand/)
drizzle/               migrações SQL do banco
```

### O que muda de uma loja para outra
Tudo o que muda fica em `src/stores/<loja>.ts`: nome, cores, fontes, logo (texto ou imagem), textos de todas as seções, WhatsApp, Instagram, e-mail, número de parcelas e páginas institucionais (trocas, privacidade...).
Os dados ficam no banco de cada loja: produtos (e, nas próximas etapas, pedidos e avaliações).

### Para criar uma nova loja
1. Copie `src/stores/ciranda-cirandinha.ts` para `src/stores/<nova-loja>.ts` e edite.
2. Registre a loja em `src/stores/index.ts` e o seed em `src/db/seed/index.ts`.
3. Crie o projeto na Vercel (veja abaixo) com `STORE=<nova-loja>`.

## Rodando localmente

```bash
npm install
cp .env.example .env.local   # ajuste STORE e, se tiver, DATABASE_URL
npm run dev                  # http://localhost:3000
```

Sem `DATABASE_URL`, o site usa os produtos de `src/db/seed/<loja>.ts`, o que ajuda no desenvolvimento. Em produção na Vercel, o banco é obrigatório.
Para ver a outra loja, troque `STORE` no `.env.local` e reinicie o `npm run dev`.

## Publicando uma loja na Vercel

1. **New Project** → importe este repositório. Framework: **Next.js**.
2. **Storage** → conecte um banco **Neon (Postgres)** exclusivo da loja. Ele cria a variável `DATABASE_URL`.
3. **Integrations** → conecte um **Upstash Redis**. Ele cria as variáveis `UPSTASH_REDIS_REST_*`.
4. **Settings → Environment Variables**: `STORE`, `MELHOR_ENVIO_*`, `STORE_ORIGIN_POSTAL_CODE`, `BREVO_*` (veja `.env.example`).
5. Crie as tabelas e grave os produtos iniciais, rodando no seu computador com o `DATABASE_URL` da loja no `.env.local`:
   ```bash
   npm run db:migrate
   npm run db:seed
   ```
6. Faça o deploy.
7. No Melhor Envio, cadastre o callback `https://<dominio-da-loja>/api/melhor-envio/callback`, que é o `siteUrl` do arquivo da loja ou a variável `SITE_URL`. Depois abra `https://<dominio-da-loja>/api/melhor-envio/authorize` uma vez para autorizar.

### Newsletter (Brevo)
Crie uma conta em brevo.com, crie uma lista em *Contatos → Listas* e anote o ID. Gere uma API Key (v3) em *SMTP e API*. Cadastre `BREVO_API_KEY` e `BREVO_LIST_ID` na Vercel. Se o e-mail já existir, a Brevo só atualiza o contato.

## Alterando o banco
Edite `src/db/schema.ts`, rode `npm run db:generate` para criar uma nova migração em `drizzle/` e depois `npm run db:migrate` **no banco de cada loja**.

## Segurança
O Client Secret e os tokens do Melhor Envio só existem no servidor. O frete usa preço, peso e dimensões lidos do banco, nunca valores enviados pelo navegador.
