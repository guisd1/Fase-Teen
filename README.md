# Template de loja (Fase Teen / Ciranda Cirandinha)

Loja virtual em **Next.js + TypeScript**: catálogo com página própria por produto, avaliações com fotos, carrinho com controle de estoque e cupons, frete pelo Melhor Envio, retirada na loja, finalização pelo WhatsApp, newsletter pela Brevo e **painel de administrador** (`/admin`).

### Painel
- **Produtos**: cadastro completo, fotos no Vercel Blob e vídeo do YouTube.
- **Pedidos**: todo pedido enviado pelo WhatsApp fica registrado com número. Status: aguardando confirmação → em preparação → enviado → entregue (ou cancelado). Ao sair de "aguardando confirmação" o estoque dos tamanhos é baixado; ao cancelar ou excluir, ele volta. O botão "Avisar cliente no WhatsApp" abre a conversa com a mensagem do status (e o rastreio, se salvo).
- **Cupons**: porcentagem ou valor fixo, compra mínima, período de validade e limite de usos. O desconto vale sobre os produtos, não sobre o frete, e é conferido de novo no servidor ao gravar o pedido.
- **Avaliações**: os clientes avaliam na página do produto (nota, comentário e até 3 fotos). Tudo entra como pendente e só aparece no site depois de aprovado aqui. Fotos em avaliações exigem Blob e Redis (o Redis limita os envios por IP).
- **Integrações**: Melhor Envio, YouTube e Blob.

O mesmo código publica várias lojas. Cada loja é **um projeto separado na Vercel** que aponta para este repositório e tem as próprias variáveis de ambiente: banco, login do painel, fotos e chaves.

## Estrutura

```
src/stores/              ← ARQUIVO CENTRAL DE MARCA (um por loja)
  types.ts               formato da configuração
  fase-teen.ts           nome, cores, fontes, logo, textos, contatos, páginas institucionais
  ciranda-cirandinha.ts
  index.ts               escolhe a loja pela variável STORE
src/db/
  schema.ts              tabelas do banco (produtos, pedidos, avaliações, cupons)
  products.ts            consultas da loja e do painel
  orders.ts / reviews.ts / coupons.ts
src/app/(shop)/          páginas da loja: início, /produto/<id>-<nome>, /institucional/<página>
src/app/admin/           painel: login, produtos, pedidos, cupons, avaliações, integrações
src/app/api/             frete, pedidos, cupom, avaliações, newsletter, Melhor Envio, YouTube, upload de fotos
src/components/          componentes da loja; src/components/admin/ os do painel
public/brand/            logo e imagens da marca
drizzle/                 migrações SQL do banco
```

### O que muda de uma loja para outra
Tudo o que muda fica em `src/stores/<loja>.ts`: nome, cores, fontes, logo (texto ou imagem), textos de todas as seções, WhatsApp, Instagram, e-mail, número de parcelas e páginas institucionais (trocas, privacidade...).
Os produtos ficam no banco de cada loja e são cadastrados pelo painel.

### Para criar uma nova loja
1. Copie `src/stores/ciranda-cirandinha.ts` para `src/stores/<nova-loja>.ts` e edite.
2. Registre a loja em `src/stores/index.ts`.
3. Crie o projeto na Vercel (veja abaixo) com `STORE=<nova-loja>`.

## Rodando localmente

```bash
npm install
cp .env.example .env.local   # ajuste STORE, DATABASE_URL e o login do painel
npm run dev                  # loja em http://localhost:3000 e painel em http://localhost:3000/admin
```

Sem `DATABASE_URL`, a loja abre com o catálogo vazio. Em produção na Vercel, o banco é obrigatório.
Para ver a outra loja, troque `STORE` no `.env.local` e reinicie o `npm run dev`.

## Publicando uma loja na Vercel

1. **New Project** → importe este repositório (o `vercel.json` já define o Next.js).
2. **Storage** → crie um banco **Neon (Postgres)** exclusivo da loja e conecte ao projeto. Ele cria `DATABASE_URL`.
3. **Storage** → crie um **Blob** exclusivo da loja e conecte ao projeto. Ele cria `BLOB_READ_WRITE_TOKEN` (fotos).
4. **Storage** → conecte um **Upstash Redis** (pode ser o mesmo nas duas lojas). Ele cria `UPSTASH_REDIS_REST_*`.
5. **Settings → Environment Variables** (veja `.env.example`):
   - `STORE`
   - Login do painel: rode `npm run admin:hash -- "sua senha"` e cadastre `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH` e `ADMIN_SESSION_SECRET`
   - `MELHOR_ENVIO_*`, `STORE_ORIGIN_POSTAL_CODE`, `BREVO_*`, `GOOGLE_CLIENT_*`
6. Crie as tabelas, com o `DATABASE_URL` da loja no `.env.local`: `npm run db:migrate`
7. Faça o deploy e entre em `https://<dominio-da-loja>/admin`.
8. Em **Integrações**, conecte o Melhor Envio e o YouTube.

### Melhor Envio
No aplicativo do Melhor Envio, cadastre o callback `https://<dominio-da-loja>/api/melhor-envio/callback` (o `siteUrl` do arquivo da loja ou a variável `SITE_URL`). Depois clique em **Conectar** na aba Integrações do painel.

### YouTube (envio de vídeos pelo painel)
1. Em console.cloud.google.com, crie um projeto para a loja e ative a **YouTube Data API v3**.
2. Em **Tela de consentimento OAuth**, configure o app e **publique em produção**. Em modo teste, o acesso expira a cada 7 dias.
3. Em **Credenciais**, crie um **ID do cliente OAuth** do tipo *Aplicativo da Web* com o URI de redirecionamento `https://<dominio-da-loja>/api/youtube/callback`.
4. Cadastre `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` na Vercel e conecte o canal em **Integrações**.
5. Peça a **auditoria da API do YouTube** (formulário "YouTube API Services – Audit and Quota Extension"). Enquanto o projeto não for auditado, os vídeos enviados pela API ficam privados. Até lá, use o campo "cole o link" do cadastro.

Limite padrão: 10.000 unidades por dia, e cada envio gasta 1.600, ou seja, cerca de 6 vídeos por dia. Capas personalizadas exigem canal verificado por telefone.

### Mercado Pago (Pix e cartão)
1. Em mercadopago.com.br/developers, **Suas integrações → Criar aplicação** (Checkout Pro / pagamentos online).
2. Copie o **Access Token** (de teste, que começa com `TEST-`, ou de produção) e cadastre `MERCADO_PAGO_ACCESS_TOKEN` na Vercel. Faça um Redeploy.
3. A conta precisa ter uma **chave Pix** cadastrada para gerar QR Codes.
4. Desconto do Pix e parcelas: `pixDiscountPercent` e `installments` em `src/stores/<loja>.ts`. Parcelamento sem juros para o cliente é configurado na conta do Mercado Pago.

O site avisa o Mercado Pago do endereço de notificação a cada pagamento (`/api/mercado-pago/webhook`) e também confere o pagamento quando o cliente está na tela, então não precisa configurar Webhooks. Se configurar, cadastre a assinatura secreta como `MERCADO_PAGO_WEBHOOK_SECRET`.
Pedido pago vai sozinho para "Em preparação" (baixando o estoque). O cliente acompanha em `/pedido/<token>`.

### Newsletter (Brevo)
Crie uma conta em brevo.com, crie uma lista em *Contatos → Listas* e anote o ID. Gere uma API Key (v3) em *SMTP e API*. Cadastre `BREVO_API_KEY` e `BREVO_LIST_ID` na Vercel.

## Alterando o banco
Edite `src/db/schema.ts`, rode `npm run db:generate` para criar uma nova migração em `drizzle/` e depois `npm run db:migrate` **no banco de cada loja**.

## Segurança
- O painel tem um único login por loja. A senha fica guardada só como hash (scrypt), e a sessão é um cookie assinado que vale 7 dias.
- Envio de fotos, sessões do YouTube e conexões com o Melhor Envio e o YouTube só funcionam para o administrador logado.
- Chaves e tokens só existem no servidor. O frete usa preço, peso e dimensões lidos do banco, nunca valores enviados pelo navegador.
