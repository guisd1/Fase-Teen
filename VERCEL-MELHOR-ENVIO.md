# Configuração Fase Teen + Melhor Envio (OAuth2)

## 1. Variáveis no Vercel

Já cadastradas:
- `MELHOR_ENVIO_CLIENT_ID`
- `MELHOR_ENVIO_CLIENT_SECRET`

Ainda criar:
- `MELHOR_ENVIO_USER_AGENT` → `Fase Teen (seuemail@exemplo.com)`
- `STORE_ORIGIN_POSTAL_CODE` → CEP da loja, somente números

## 2. Upstash Redis

A autorização OAuth precisa guardar `access_token` e `refresh_token` entre execuções serverless. O projeto usa Upstash Redis pela integração da Vercel.

Na Vercel:
1. Project → Integrations.
2. Marketplace → Storage → Upstash for Redis.
3. Conecte uma base ao projeto.
4. A integração cria as variáveis do Redis.

O código aceita tanto `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` quanto `KV_REST_API_URL` / `KV_REST_API_TOKEN`.

## 3. Cadastro do aplicativo no Melhor Envio

Callback exato:
`https://fase-teen.vercel.app/api/melhor-envio/callback`

Permissão necessária para esta versão:
`shipping-calculate`

## 4. Primeira autorização

Depois do deploy com Redis e variáveis configuradas, abra no navegador:
`https://fase-teen.vercel.app/api/melhor-envio/authorize`

Faça login/autorização no Melhor Envio. Ao concluir, o callback salva os tokens no Redis e volta ao site.

## 5. Renovação

O backend verifica a validade do access token e usa o refresh token para renová-lo. O Melhor Envio documenta access tokens de 30 dias e refresh tokens de 45 dias para OAuth2.

## 6. Frete

A rota `/api/frete` continua recebendo CEP + IDs/quantidades do carrinho e usa a API de cotação em produção. Os pesos e dimensões dos produtos ficam no `catalog.mjs`.
