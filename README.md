# Fase Teen — Modelo de Loja Virtual

Este projeto é um modelo de e-commerce front-end para a marca Fase Teen.

## O que já vem pronto
- Página inicial com identidade visual feminina/teen.
- Catálogo de produtos.
- Filtro por categoria.
- Busca por nome/cor/categoria.
- Ordenação por preço/nome/destaques.
- Página modal de produto com tamanho e cor.
- Carrinho com alteração de quantidade.
- Carrinho salvo no navegador (localStorage).
- Checkout que monta o pedido e abre o WhatsApp.
- Layout responsivo para celular, tablet e computador.
- Espaços prontos para trocar imagens, produtos, Instagram e WhatsApp.

## 1) Trocar produtos
Abra `products.js` e altere:
- `name`
- `category`
- `price`
- `oldPrice`
- `sizes`
- `colors`
- `image`
- `featured`
- `badge`
- `description`

Exemplo:
image: "assets/products/minha-peca.jpg"

Você pode colocar suas imagens na pasta:
`assets/products/`

## 2) Trocar o WhatsApp
No final de `products.js`, edite:
whatsapp: "5500000000000"

Coloque o número com código do Brasil + DDD, somente números.
Exemplo de formato:
5511999999999

## 3) Trocar Instagram
No mesmo `storeConfig`:
instagram: "https://instagram.com/seuinstagram"
instagramHandle: "@seuinstagram"

## 4) Trocar identidade visual
As cores principais estão no começo do arquivo `styles.css`, dentro de `:root`.
Você pode alterar:
--pink
--pink-dark
--rose
--ink
--cream

## 5) Colocar o site no ar
Este modelo é estático e pode ser hospedado em serviços como Vercel, Netlify, GitHub Pages ou hospedagem tradicional.

Basta enviar:
- index.html
- styles.css
- app.js
- products.js
- pasta assets/

## Importante sobre "vender pelo site"
O modelo já faz o catálogo, carrinho e fechamento do pedido pelo WhatsApp.
Para cobrar cartão/Pix diretamente dentro do site, será necessário integrar um gateway de pagamento e, em uma etapa mais completa, um backend/banco de dados para pedidos, estoque e pagamentos.

## Estrutura
fase-teen-site/
├── index.html
├── styles.css
├── app.js
├── products.js
├── README.md
└── assets/
    └── products/
        ├── produto-01.svg
        ├── produto-02.svg
        └── ...


## Correção desta versão

`products.js` voltou a ser um script JavaScript comum. Assim, o catálogo funciona também quando você abre `index.html` diretamente no navegador do computador. A função serverless continua usando o arquivo separado `catalog.mjs`, portanto o cálculo do frete no Melhor Envio permanece separado do código do cliente.
