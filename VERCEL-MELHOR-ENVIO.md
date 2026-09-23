# Publicar a Fase Teen com frete Melhor Envio

## O que foi implementado
O navegador envia apenas CEP, IDs e quantidades para `/api/frete`.
A função serverless lê o catálogo do `products.js`, monta peso/dimensões/valor dos produtos e consulta o Melhor Envio.
O token fica somente em variável de ambiente da Vercel.

## Configurar
Na Vercel: Settings → Environment Variables.

`MELHOR_ENVIO_TOKEN` = token do Melhor Envio gerado no painel.
`STORE_ORIGIN_POSTAL_CODE` = CEP de origem da loja, somente números.
`MELHOR_ENVIO_USER_AGENT` = nome da aplicação + e-mail de contato técnico.

O endpoint usado em produção é:
`https://melhorenvio.com.br/api/v2/me/shipment/calculate`

## Publicação
1. Suba esta pasta em um projeto Vercel.
2. Configure as três variáveis.
3. Faça o deploy.
4. Teste um pedido real com seu próprio CEP.
5. Teste no celular.

## Catálogo
No `products.js`, cada produto tem:

`shipping: { weight: 0.35, height: 6, width: 23, length: 30 }`

Peso em kg e dimensões em cm.

## Pagamento
O site não processa pagamentos. Depois da cotação, o pedido e o frete escolhido são enviados ao WhatsApp para confirmação e cobrança.

## Retirada
A cliente pode escolher “Retirar na loja”; nesse caso o frete fica R$ 0,00 e a informação segue para o WhatsApp.

## Segurança
Nunca coloque o token do Melhor Envio em `app.js` ou `products.js`.
