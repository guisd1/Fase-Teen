# Fase Teen — Loja Virtual v3

Loja estática responsiva com catálogo, carrinho, retirada na loja, cálculo de frete Melhor Envio e finalização do pedido pelo WhatsApp.

## Melhor Envio

A integração agora usa OAuth2 e guarda tokens de forma persistente em Upstash Redis, adequado para as funções serverless da Vercel.

Rotas:
- `/api/melhor-envio/authorize` — inicia autorização
- `/api/melhor-envio/callback` — recebe o code e salva tokens
- `/api/frete` — calcula opções de frete

O callback usado pela loja é:
`https://fase-teen.vercel.app/api/melhor-envio/callback`

## Segurança

Client Secret, access token e refresh token nunca ficam no JavaScript do navegador.

## Catálogo

Edite `products.js` para o site e `catalog.mjs` para os dados usados no servidor. Ambos devem permanecer sincronizados para nome/preço e peso/dimensões de frete.

## Deploy

1. Envie os arquivos para GitHub.
2. Aguarde a Vercel publicar.
3. Configure `MELHOR_ENVIO_CLIENT_ID` e `MELHOR_ENVIO_CLIENT_SECRET`.
4. Configure `MELHOR_ENVIO_USER_AGENT` e `STORE_ORIGIN_POSTAL_CODE`.
5. Instale Upstash Redis pelo Marketplace da Vercel.
6. Faça um novo deploy.
7. Abra `https://fase-teen.vercel.app/api/melhor-envio/authorize` uma vez para autorizar.
