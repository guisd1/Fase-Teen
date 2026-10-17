# Fase Teen — Plano de funcionalidades do e-commerce

> Especificação para implementação no site. Baseada no episódio #082 do Marcas Podcast ("E-commerce de moda: como escalar vendas e fidelizar clientes", com Christopher Neiverth e Oscar Ferreira).

---

## Instruções para o agente (Claude no VS Code)

1. **Leia este arquivo inteiro antes de começar**, mas implemente **um item por vez**, na ordem da seção [Roadmap](#roadmap).
2. Antes de codar cada item, **explore o projeto** e responda:
   - Qual é a plataforma/stack (Shopify, Nuvemshop, Next.js, etc.)?
   - Quais arquivos serão alterados ou criados?
   - Existe app/plugin pronto da plataforma que resolva melhor do que código próprio?
   Mostre o plano e **aguarde aprovação** antes de alterar arquivos.
3. **Regras obrigatórias para todos os itens:**
   - Nada de dados falsos. Cronômetros, estoques, contadores de vendas e avaliações devem vir de **dados reais** (backend, plataforma ou configuração com datas reais). Nunca números fixos no código ou aleatórios.
   - Mobile first: a maior parte do tráfego é celular. Testar em largura de 375px.
   - Não degradar a performance: evitar scripts pesados; carregar widgets de forma assíncrona/lazy.
   - Toda funcionalidade configurável deve poder ser **ligada/desligada** sem mexer em código (setting do tema, variável de ambiente ou painel admin).
   - Textos em português do Brasil, tom jovem e direto.
4. Ao terminar cada item, liste: o que foi feito, como testar e o que ficou pendente. Marque o checkbox correspondente neste arquivo.

---

## Conceito central

- Toda compra é **desejo menos medo**. Se o medo for maior, não há venda. Cada página deve gerar desejo **e** tirar medo.
- O e-commerce vende **foto, vídeo, texto e confiança**, não só produto.
- O tráfego leva a pessoa até a porta; quem vende é a página.
- **Público teen:** quem deseja a peça costuma ser a adolescente; quem paga muitas vezes é mãe/pai/responsável. O desejo é trabalhado para a adolescente; o medo é tirado para quem paga (troca, prazo, segurança, qualidade).

---

## Resumo

| # | Funcionalidade | Área | Prioridade | Esforço | Tipo |
|---|---|---|---|---|---|
| 1 | Contagem regressiva de promoção (horas) | Urgência | Alta | Baixo | Código/App |
| 2 | Aviso de estoque baixo por tamanho | Urgência | Alta | Baixo | Código |
| 3 | Indicador de vendas recentes reais | Urgência | Média | Baixo | Código |
| 4 | Avaliações com foto da cliente | Prova social | Alta | Baixo | App |
| 5 | Contador de clientes e depoimentos | Prova social | Alta | Baixo | Código |
| 6 | Vídeo de bastidores + Quem Somos | Prova social | Média | Médio | Código + conteúdo |
| 7 | Feed de clientes/influenciadoras | Prova social | Média | Médio | App/Código |
| 8 | Galeria de fotos completa (8+) | Página de produto | Alta | Médio | Código + conteúdo |
| 9 | Vídeo curto do produto | Página de produto | Alta | Baixo | Código + conteúdo |
| 10 | Título com benefício principal | Página de produto | Alta | Baixo | Conteúdo |
| 11 | Benefícios em tópicos antes do Comprar | Página de produto | Alta | Baixo | Código |
| 12 | Bloco anti-medo (troca, frete, medidas, WhatsApp) | Página de produto | Alta | Baixo | Código |
| 13 | Landing page do produto campeão | Página de produto | Média | Médio | Código |
| 14 | Checkout curto e sem senha | Checkout | Alta | Médio | Config/Código |
| 15 | Barra de frete grátis + selos de oferta | Oferta | Alta | Baixo | Código |
| 16 | Básicos perenes x Drops limitados | Oferta | Média | Médio | Código |
| 17 | Compre junto / Complete o look | Oferta | Média | Baixo | Código/App |
| 18 | Pós-venda no WhatsApp | Recorrência | Alta | Médio | Processo + integração |
| 19 | Preferências e segmentação | Recorrência | Média | Médio | Código + CRM |
| 20 | Grupo/canal VIP | Recorrência | Média | Médio | Processo |
| 21 | Unboxing (cartinha, embalagem, QR) | Recorrência | Média | Baixo | Processo |
| 22 | Conteúdo e criativos com gancho | Conteúdo | Alta | Alto | Processo |
| 23 | Checklist e métricas do site | Gestão | Média | Baixo | Código (tracking) + processo |

---

## 1. Urgência e escassez

Ideia do vídeo: o "gatilho Booking" — cronômetro e "só restam X" geram a sensação de que, se não comprar agora, perde.

### [x] Item 1 — Promoção com contagem regressiva de algumas horas

**Objetivo:** criar urgência com prazo curto e visível.

**Requisitos:**
- Barra fixa no topo (announcement bar) com texto da oferta + cronômetro `HH:MM:SS`. Ex.: `Só hoje: 20% OFF em moletons — termina em 05:42:10`.
- Mesmo cronômetro na página dos produtos participantes (acima do preço) e no carrinho quando houver item participante.
- Configuração: `inicio` (datetime), `fim` (datetime), `texto`, `link`, `produtos/coleções participantes`, `ativo` (bool).
- O cronômetro calcula o tempo restante a partir do `fim` configurado e do horário do servidor/fuso `America/Sao_Paulo`.
- Ao chegar a zero: o cronômetro some e o preço promocional deixa de valer (sincronizado com a regra de desconto da plataforma).

**Critérios de aceite:**
- [x] O tempo restante é o mesmo para qualquer visitante (não reinicia por sessão/cookie).
- [x] Fora da janela `inicio–fim`, nada aparece.
- [ ] Funciona e não quebra o layout em 375px. *(feito pensando no celular; falta conferir na tela)*
- [x] Pode ser desligado pelo admin/tema.

**Proibido:** cronômetro "evergreen" que reinicia por visitante; promoção que continua após o fim.

> **Como ficou (2026-10-17):** painel → Promoções → "Promoção relâmpago" (ligada/desligada, texto, link, desconto, início, fim, produtos ou categorias). Ao salvar, o desconto e as datas vão para a "Promoção com data" de cada produto marcado, e o checkout cobra o preço certo no servidor. A barra do topo, o cronômetro da página do produto e o aviso no carrinho contam até o fim salvo no banco. No navegador, o preço troca sozinho no início e no fim, mesmo com a página aberta ou em cache.

### [x] Item 2 — Aviso de estoque baixo por tamanho

**Requisitos:**
- Ao selecionar um tamanho com estoque `<= LIMITE` (padrão 5, configurável), exibir: `Últimas 2 no tamanho M`.
- Opcional: barrinha visual de estoque.
- Tamanho esgotado: botão `Avise-me quando chegar` que captura e-mail/WhatsApp (com consentimento) vinculado à variante.

**Critérios de aceite:**
- [x] Quantidade lida do estoque real da variante.
- [x] Atualiza ao trocar de tamanho sem recarregar a página.
- [x] Inscrições de "avise-me" ficam salvas e exportáveis.

> **Como ficou (2026-10-17):** painel → Promoções → "Estoque baixo" (liga/desliga e limite, padrão 5). Na página do produto, abaixo dos tamanhos: "Últimas 2 no tamanho M" (ou "Última peça"), trocando junto com o tamanho (sem barrinha, por escolha da loja). O "Avise-me" (nome + WhatsApp) já existia; a aba Avise-me ganhou "Baixar planilha (Excel)".

### [ ] Item 3 — Indicador de vendas recentes reais

**Requisitos:**
- Selo na página de produto: `27 vendidos nas últimas 24h` **ou** `Mais vendido da semana`.
- Exibir apenas se o número real >= mínimo configurável (ex. 10). Abaixo disso, não mostrar ou usar só o selo de mais vendido calculado.
- (Opcional) notificação discreta de compra recente sem nome ou dados pessoais (ex. `Alguém de BH comprou o Cropped X`).

**Critérios de aceite:**
- [ ] Números vêm dos pedidos reais (query/API da plataforma, com cache).
- [ ] Nenhum dado pessoal exposto.

---

## 2. Prova social: a loja não pode parecer nova

Ideia do vídeo: a cliente que chega precisa sentir que estava por fora por não conhecer a marca. Ninguém quer ser o único a comprar.

### [ ] Item 4 — Avaliações com foto da cliente usando a peça

**Requisitos:**
- Integrar app de avaliações com foto/vídeo (ex.: Lily Reviews, Judge.me, Yotpo, Trustvox — escolher conforme a plataforma).
- Bloco de avaliações **logo abaixo da galeria** (não no fim da página) + nota média perto do título.
- Pedido de avaliação automático 7–10 dias após a entrega, com incentivo (cupom/cashback) para avaliação com foto.
- Filtro/campo de tamanho comprado e altura da cliente.

**Critérios de aceite:**
- [ ] Apenas avaliações de compras reais.
- [ ] Fotos carregam em lazy load.

### [ ] Item 5 — Contador de clientes e depoimentos em destaque

**Requisitos:**
- Faixa na home com números reais: clientes atendidas, total de avaliações, nota média.
- Seção `Quem já usa Fase Teen` com fotos de clientes (somente com autorização registrada).

**Critérios de aceite:**
- [ ] Números vêm de fonte real ou configuração revisada manualmente pela equipe (não inventados).

### [ ] Item 6 — Vídeo de bastidores + página Quem Somos

**Requisitos:**
- Componente de vídeo curto (30–60s, vertical) mostrando a equipe embalando e despachando pedidos.
- Exibir na home e na página Quem Somos; opcional mini-player flutuante no canto (fechável).
- Página Quem Somos com: história da marca, fotos da equipe, CNPJ, endereço/contato, tempo de mercado, selos de segurança.

**Critérios de aceite:**
- [ ] Vídeo não toca com som automaticamente; não bloqueia o carregamento.
- [ ] Mini-player pode ser fechado e não cobre o botão Comprar no mobile.

### [ ] Item 7 — Feed de clientes e influenciadoras no site

**Requisitos:**
- Galeria "compre o look" com posts/vídeos (Instagram/TikTok) clicáveis para os produtos.
- Na página de produto: `Veja quem está usando` com conteúdo marcado com aquela peça.

**Critérios de aceite:**
- [ ] Conteúdo só com autorização de uso de imagem.
- [ ] Carregamento lazy, sem impacto relevante no LCP.

---

## 3. Página de produto (PDP) que gera desejo e tira medo

Exercício do vídeo: peça para alguém da equipe "vender" a peça falando e confira se tudo o que foi dito está na página.

### [ ] Item 8 — Galeria completa (mínimo 8 fotos)

**Requisitos técnicos:**
- Galeria suporta 8+ imagens e vídeo, com swipe no mobile e zoom.
- Legenda/meta configurável: `Modelo veste M e tem 1,65m`.
- Ordem recomendada de conteúdo (para a equipe):
  1. Look completo aspiracional (modelo que representa quem a cliente teen **quer ser**).
  2. Imagem com 3–4 benefícios em tópicos.
  3. Print de depoimento de cliente.
  4. Detalhes: costura, estampa/logo, textura do tecido, peça dobrada, com embalagem, costas, lateral.

**Critérios de aceite:**
- [ ] Imagens em formato otimizado (WebP/AVIF) e lazy load a partir da 2ª.
- [ ] Script/relatório listando produtos com menos de 8 fotos (para a equipe completar).

### [ ] Item 9 — Vídeo curto em cada produto

**Requisitos:**
- Suporte a vídeo vertical (15–60s) como 2º item da galeria ou player abaixo das fotos.
- Autoplay mudo em loop opcional; controles visíveis.

**Critérios de aceite:**
- [ ] Vídeo não é baixado antes de entrar na viewport.

### [ ] Item 10 — Título com o principal benefício

**Tarefa de conteúdo (não exige código):**
- Ex.: `Moletom Cropped Rosa` → `Moletom Cropped Rosa Ultra Macio que Não Faz Bolinha`.
- Começar pelos 20 produtos mais vendidos.
- Se necessário, gerar um CSV com `id, título atual, sugestão de título` para revisão da equipe antes de aplicar.

**Critérios de aceite:**
- [ ] Títulos revisados por humano antes de publicar.
- [x] Slugs/URLs existentes não quebram (redirecionamento se mudarem).

> **Situação (2026-10-17):** a ferramenta está pronta, falta o conteúdo. Painel → Produtos → "Planilha de títulos" baixa os produtos ativos dos mais vendidos (peças em pedidos pagos) para os menos vendidos, depois por vezes no carrinho, com coluna "Título sugerido" e o que o cadastro diz da peça (composição, descrição). O cadastro do produto tem a dica de como escrever o título. O link do produto usa o número dele e redireciona para o nome novo, então trocar o título não quebra links. **Pendente:** hoje só existe 1 produto, de teste, e nenhuma venda. Quando o catálogo real entrar, gerar as sugestões só com benefícios que estejam no cadastro (nada inventado) e revisar antes de aplicar.

### [ ] Item 11 — Benefícios em tópicos antes do botão Comprar

**Requisitos:**
- Bloco de 3–5 tópicos curtos com ícone, entre o preço e o botão Comprar.
- Fonte dos dados: metafield/campo customizado por produto (ex. `beneficios: string[]`), com fallback para nada (não exibir bloco vazio).
- Descrição completa abaixo, alternando texto e imagem.

**Critérios de aceite:**
- [ ] Editável pelo admin sem código.
- [ ] Não empurra o botão Comprar para fora da primeira tela no mobile (testar 375x667).

### [x] Item 12 — Bloco anti-medo

**Requisitos:**
- Selos abaixo do botão Comprar (configuráveis): `Troca fácil em 30 dias`, `Frete grátis acima de R$ X`, `Compra 100% segura`, `Envio em 24h`.
- Calculadora de frete e prazo por CEP na própria PDP.
- Guia de medidas em modal: tabela + "qual é o meu tamanho?" por altura/peso.
- Botão de WhatsApp na PDP com mensagem pré-preenchida contendo o nome/link do produto.
- Links visíveis para política de troca e formas de pagamento (foco em pais/responsáveis).

**Critérios de aceite:**
- [x] Os textos dos selos refletem políticas reais da loja.
- [ ] Botão de WhatsApp não cobre o botão Comprar no mobile.

> **Como ficou (2026-10-17):** selos com as regras reais (troca de tamanho em 7 dias com link para a política, frete grátis pelo PAC a partir do valor do painel, compra segura pelo Mercado Pago com link para formas de pagamento, prazo de postagem). Frete e prazo de 1 peça por CEP na página do produto (não mexe no frete do carrinho). Tabela de medidas em janela, que sobe de baixo no celular, com o tamanho escolhido destacado. WhatsApp com o nome, a referência, o tamanho e o link da peça. **Não feito, por escolha:** "qual é o meu tamanho?" por altura/peso, porque as tabelas têm medidas da peça, não faixas de altura/peso (seria recomendação inventada). **Pendente:** o botão flutuante do WhatsApp fica fixo no canto e pode passar por cima da ponta do botão Comprar durante a rolagem no celular; conferir na tela.

### [ ] Item 13 — Landing page do produto campeão

**Requisitos:**
- Template de landing page longa para um produto: hero com foto/vídeo grande, benefícios, galeria lifestyle, avaliações, FAQ, bloco anti-medo, cronômetro (item 1, se houver oferta) e botão Comprar fixo no mobile.
- Seleção de variante e "adicionar ao carrinho" na própria página.
- Reutilizável para outros produtos (template, não página hardcoded).

**Critérios de aceite:**
- [ ] Eventos de analytics iguais aos da PDP (view_item, add_to_cart) para comparar conversão.

---

## 4. Checkout e oferta

Ideia do vídeo: o maior concorrente do checkout é a notificação do celular; quanto mais longo o processo, mais a cliente sai.

### [ ] Item 14 — Checkout curto e sem senha

**Requisitos:**
- Máximo de 3 etapas: dados → entrega/pagamento → confirmação.
- Compra como visitante habilitada.
- Login sem senha (código por e-mail/WhatsApp) ou login social, se a plataforma permitir.
- Autopreenchimento de endereço por CEP.
- Pix com desconto destacado.

**Critérios de aceite:**
- [ ] Nenhuma etapa exige criar senha para comprar.
- [ ] Testado do zero em celular: tempo da PDP até pedido concluído medido e documentado.

### [ ] Item 15 — Oferta além do desconto

**Requisitos:**
- Barra de progresso no carrinho/minicart: `Faltam R$ 32 para frete grátis` (valor mínimo configurável).
- Selo `Pronta entrega — chega em X dias` para produtos em estoque (prazo estimado por região se possível).
- Suporte a kits/combos com preço especial (se a plataforma permitir).
- (Opcional) exibição de cashback para próxima compra.

**Critérios de aceite:**
- [ ] Barra recalcula ao alterar o carrinho sem recarregar.

### [ ] Item 16 — Básicos perenes x Drops limitados

**Requisitos:**
- Duas coleções/vitrines: `Básicos Fase Teen` (sempre em estoque) e `Drops` (edição limitada).
- Página de drop com contagem regressiva para o lançamento (usa o componente do item 1) e captura de interesse antes da abertura.
- Selo `Edição limitada` apenas em produtos marcados como tal (tag/metafield).

**Critérios de aceite:**
- [ ] "Edição limitada" só aparece se o produto realmente não será reposto.

### [ ] Item 17 — Compre junto / Complete o look

**Requisitos:**
- Na PDP: bloco `Complete o look` com 2–3 produtos relacionados (configuração manual por produto, fallback por coleção).
- No carrinho: sugestão de itens de menor valor (acessórios).
- Adicionar ao carrinho direto do bloco.

**Critérios de aceite:**
- [ ] Não sugere produtos esgotados.

---

## 5. Recorrência e relacionamento

Itens majoritariamente de processo. O que for código está indicado.

### [ ] Item 18 — Pós-venda pessoal no WhatsApp
- Processo: após a entrega, mensagem/áudio da fundadora perguntando se gostou e **por que comprou**. Guardar respostas: frases boas viram descrição e criativo; reclamações viram ação.
- **Código/integração:** checkbox de consentimento (opt-in) para WhatsApp/e-mail no checkout; exportação ou webhook de pedidos entregues para a ferramenta de WhatsApp/CRM.
- Começar manual; automatizar depois de validar.

### [ ] Item 19 — Preferências e segmentação
- **Código:** salvar tamanho(s) comprado(s) por cliente; campo opcional de estilo preferido (ex. streetwear, romântico, básico) no pós-compra ou na conta.
- Segmentos mínimos: por tamanho (PP–GG), 1ª compra, recorrente, inativa há 60+ dias.
- Uso: sobras de grade (PP, GG) enviadas para quem compra esse tamanho.

### [ ] Item 20 — Grupo/canal VIP
- Processo: canal ou grupo `VIP Fase Teen` com acesso antecipado a drops, cupons e enquetes.
- Preferir **canal** (só a marca posta) por envolver menores; moderar conteúdo.

### [ ] Item 21 — Unboxing
- Cartinha personalizada, embalagem "instagramável", cartão com QR code levando à página de avaliação (item 4) com incentivo.
- **Código:** URL/QR de avaliação que identifica o pedido (sem expor dados pessoais na URL).

---

## 6. Conteúdo e gestão

### [ ] Item 22 — Conteúdo e criativos com gancho (processo)
- Prender a atenção nos primeiros 2–3 segundos; produto depois.
- Testar vários ganchos por semana; multiplicar o que tiver melhor CTR.
- Animar fotos de produto em vídeo; unboxing com microinfluenciadoras; usar fotos/áudios reais de clientes com autorização.

### [ ] Item 23 — Checklist e métricas
- **Código:** garantir eventos de analytics (GA4/Meta Pixel): `view_item`, `add_to_cart`, `begin_checkout`, `purchase`; instalar mapa de calor (Microsoft Clarity ou Hotjar).
- **Código:** excluir tráfego interno da equipe das métricas (filtro por IP ou cookie de equipe).
- Processo mensal: conferir se cada produto tem 8+ fotos, vídeo, título com benefício, tópicos, avaliações e selos.
- Métricas: conversão, abandono de carrinho, recompra, markup, giro por peça, CTR dos anúncios.

---

## 7. Cuidados legais (público teen)

- **Urgência, escassez, contadores e avaliações sempre reais.** Dado falso pode configurar publicidade enganosa (CDC).
- **Publicidade e menores:** o CDC considera abusiva a publicidade que se aproveita da falta de julgamento e experiência da criança. Evitar pressão exagerada; falar também com os responsáveis.
- **LGPD:** dados de crianças e adolescentes devem ser tratados no melhor interesse deles. Coletar o mínimo necessário; autorização para uso de imagem.
- **WhatsApp/e-mail:** só com consentimento e com opção fácil de descadastro.
- Este documento não é parecer jurídico; validar com advogado antes de colocar campanhas no ar.

---

## Roadmap

### Fase 1 — Ganhos rápidos (semanas 1–2)
- [x] 1 Contagem regressiva
- [x] 2 Estoque baixo
- [x] 12 Bloco anti-medo
- [ ] 10 Títulos com benefício (20 mais vendidos)
- [ ] 11 Tópicos antes do Comprar
- [ ] 15 Barra de frete grátis e selos

### Fase 2 — Confiança e conteúdo (semanas 3–6)
- [ ] 4 Avaliações com foto
- [ ] 5 Contadores e depoimentos
- [ ] 8 Galeria 8+ fotos
- [ ] 9 Vídeo do produto
- [ ] 14 Checkout curto
- [ ] 18 Opt-in e pós-venda manual
- [ ] 23 Tracking e mapa de calor

### Fase 3 — Escala e recorrência (meses 2–3)
- [ ] 6 Bastidores e Quem Somos
- [ ] 7 Feed social
- [ ] 13 Landing page do campeão
- [ ] 16 Básicos x Drops
- [ ] 17 Complete o look
- [ ] 19 Segmentação
- [ ] 21 QR de avaliação no unboxing

---

## Prompt sugerido para começar

```
Leia o arquivo FASE_TEEN_PLANO_ECOMMERCE.md inteiro.
Depois explore este projeto e me diga: qual é a stack/plataforma,
onde ficam a home, a página de produto, o carrinho e o checkout,
e qual sua proposta para implementar o Item 1 (contagem regressiva).
Não altere nenhum arquivo ainda.
```
