# Newsletter com Brevo (grátis)

O formulário "Fique por dentro" do site agora envia o e-mail de verdade
para uma lista de contatos na Brevo (plataforma gratuita de e-mail
marketing). Siga os passos abaixo para ativar.

## 1. Crie a conta na Brevo

1. Acesse https://www.brevo.com e crie uma conta gratuita.
2. Confirme seu e-mail e finalize o cadastro.

## 2. Crie a lista de contatos

1. No painel da Brevo, vá em **Contatos > Listas**.
2. Crie uma lista, por exemplo "Site Fase Teen".
3. Abra a lista criada e anote o **ID da lista** (aparece na URL ou nos
   detalhes da lista, é um número).

## 3. Gere a API Key

1. Vá em **Configurações da conta > SMTP e API** (ou busque por "API Keys").
2. Gere uma nova "API Key" (v3).
3. Copie a chave gerada — ela só é mostrada uma vez.

## 4. Configure as variáveis na Vercel

No painel do seu projeto na Vercel, vá em **Settings > Environment
Variables** e adicione:

| Nome            | Valor                          |
|-----------------|---------------------------------|
| `BREVO_API_KEY` | a API Key copiada no passo 3    |
| `BREVO_LIST_ID` | o ID da lista anotado no passo 2|

Depois de salvar, faça um novo deploy (ou clique em "Redeploy") para as
variáveis passarem a valer.

## Como funciona

- O formulário chama a rota `/api/newsletter` (arquivo `api/newsletter.js`).
- Essa rota cadastra o e-mail como contato na Brevo, na lista configurada.
- Se o e-mail já existir na lista, ele é apenas atualizado — não dá erro.
- Se `BREVO_API_KEY` ou `BREVO_LIST_ID` não estiverem configurados, o
  site mostra um erro amigável pedindo para configurar (em vez de falhar
  silenciosamente).

## Testando localmente

Rodando o projeto localmente (`vercel dev`), crie um arquivo `.env` (veja
`.env.example`) com `BREVO_API_KEY` e `BREVO_LIST_ID` preenchidos, digite
um e-mail no formulário do site e confira em **Contatos** no painel da
Brevo se ele apareceu.
