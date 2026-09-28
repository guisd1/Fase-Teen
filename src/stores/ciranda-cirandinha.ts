import type { StoreConfig } from "./types";

/*
  Configuração da Ciranda Cirandinha: moda infantil do recém-nascido ao
  juvenil, com lojas físicas em Espinosa e Montes Claros (MG). Mesmas regras
  de envio e troca da Fase Teen. Pendentes: domínio próprio e logo oficial.
*/
const cirandaCirandinha: StoreConfig = {
  id: "ciranda-cirandinha",
  name: "Ciranda Cirandinha",
  siteUrl: "https://ciranda-cirandinha.vercel.app", // EDITE com o domínio real do projeto na Vercel

  meta: {
    title: "Ciranda Cirandinha | Moda infantil do bebê ao juvenil",
    description: "Ciranda Cirandinha: moda infantil do recém-nascido ao juvenil, com lojas em Espinosa e Montes Claros (MG) e envio para todo o Brasil."
  },

  theme: {
    // Paleta tirada do logo provisório: azul "Ciranda", verde "Cirandinha",
    // amarelo do pintinho, rosa dos corações, azul-céu e creme da placa.
    primary: "#3c9cd8",
    primaryDark: "#2677b0",
    primarySoft: "#eaf5fc",
    primaryLight: "#a8d8f0",
    accent: "#9cb460",
    logoText: "#3c9cd8",
    ink: "#1e3a52",
    heroGradient: ["#d4ecfa", "#fdf6ee", "#fde3ea"],
    cardGradient: ["#5aaee3", "#3c9cd8"],
    cardBackGradient: ["#fcd848", "#fc90a8"],
    fonts: {
      googleFontsUrl: "https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&family=Fredoka:wght@500;600;700&display=swap",
      heading: "\"Fredoka\", \"Trebuchet MS\", sans-serif",
      body: "\"Nunito\", Arial, sans-serif"
    }
  },

  logo: {
    main: "Ciranda",
    sub: "CIRANDINHA",
    icon: "/brand/ciranda-icon.png",
    monogram: "CC"
  },

  contact: {
    whatsapp: "5538998286040",
    instagramUrl: "https://instagram.com/lojacirandacirandinhaespi",
    instagramHandle: "@lojacirandacirandinhaespi"
  },

  commerce: {
    installments: 3,
    shippingNote: "Enviado em até 1 dia útil. Pedidos feitos depois das 16h são postados no próximo dia útil.",
    sizeChartNote: "Confira as medidas antes de comprar. Se o tamanho não servir, você pode trocar por outro em até 7 dias após receber (o frete da troca é por conta da cliente).",
    returnDays: 7
  },

  texts: {
    topbar: "LOJAS EM ESPINOSA E MONTES CLAROS • ENVIO PARA TODO O BRASIL • POSTAGEM EM ATÉ 1 DIA ÚTIL",
    nav: { home: "Início", news: "Novidades", collection: "Coleção", about: "Nossas lojas" },
    hero: {
      eyebrow: "DO RECÉM-NASCIDO AO JUVENIL",
      title: "Roupinhas para cada fase da infância.",
      text: "Da primeira roupinha do bebê ao look do juvenil: moda infantil confortável e cheia de estilo, com lojas em Espinosa e Montes Claros e envio para todo o Brasil.",
      primaryCta: "Ver a coleção",
      secondaryCta: "Novidades",
      pill: "NOVO",
      image: "/brand/ciranda-cirandinha.png", // logo provisório
      cardTop: "CIRANDA",
      cardBottom: "KIDS",
      cardCaption: "Moda infantil"
    },
    benefits: [
      { icon: "store", title: "Lojas em Espinosa e Montes Claros", text: "Retire seu pedido na loja, sem custo de frete." },
      { icon: "ruler", title: "Tabela de medidas", text: "Medidas de cada peça para acertar o tamanho de primeira." },
      { icon: "truck", title: "Envio para todo o Brasil", text: "Postagem em até 1 dia útil após a confirmação." },
      { icon: "chat", title: "Atendimento pelo WhatsApp", text: "Tire dúvidas de tamanho antes de comprar." }
    ],
    featured: { eyebrow: "ACABOU DE CHEGAR", title: "Novidades que chegaram", link: "Ver coleção →" },
    banner: {
      eyebrow: "DO BEBÊ AO JUVENIL",
      title: "Uma loja para todas as fases.",
      text: "Do recém-nascido ao juvenil de 18 anos, peças para o dia a dia, a escola, os passeios e as festas. Tudo num lugar só, para a família inteira.",
      cta: "Explorar produtos",
      stickers: ["bebê", "infantil", "juvenil", "conforto"]
    },
    catalog: {
      eyebrow: "COLEÇÃO",
      title: "Encontre o look perfeito",
      searchPlaceholder: "Buscar por peça, cor ou categoria..."
    },
    about: {
      eyebrow: "NOSSAS LOJAS",
      title: "Ciranda Cirandinha: vestindo a infância em Minas.",
      paragraphs: [
        "A Ciranda Cirandinha veste crianças do recém-nascido ao juvenil. Temos lojas físicas em Espinosa e em Montes Claros, em Minas Gerais, e agora também atendemos pelo site, com envio para todo o Brasil.",
        "Comprou pelo site e mora perto? Você pode retirar o pedido em uma das nossas lojas, sem custo de frete. Ficou com dúvida sobre tamanho? Fale com a gente pelo WhatsApp antes de comprar."
      ],
      cta: "Ver a coleção"
    },
    newsletter: { eyebrow: "FAÇA PARTE", title: "Receba novidades e ofertas." },
    footer: { tagline: "Moda infantil do bebê ao juvenil. Lojas em Espinosa e Montes Claros (MG)." },
    checkout: {
      intro: "Preencha seus dados. Ao continuar, o pedido será enviado para o WhatsApp da Ciranda Cirandinha para confirmação de estoque, entrega e pagamento."
    },
    whatsappGreeting: "Olá! Vim pelo site da Ciranda Cirandinha e gostaria de atendimento."
  },

  pages: {
    trocas: {
      title: "Trocas, devoluções e envio",
      paragraphs: [
        "PRAZO DE ENVIO: os pedidos são postados em até 1 dia útil após a confirmação do pagamento. Pedidos confirmados depois das 16h são postados no próximo dia útil. O prazo de entrega da transportadora começa a contar a partir da postagem e aparece no cálculo do frete.",
        "RETIRADA NA LOJA: você pode retirar o pedido em uma das nossas lojas, em Espinosa ou em Montes Claros (MG), sem custo de frete. Combinamos pelo WhatsApp quando estiver pronto.",
        "TROCA POR TAMANHO: você pode trocar a peça por outro tamanho do mesmo modelo em até 7 dias corridos após o recebimento, conforme a disponibilidade em estoque. A peça deve voltar sem uso, sem lavagem e com a etiqueta. O frete para enviar a peça e para receber o novo tamanho é por conta da cliente. Para acertar de primeira, cada peça tem uma tabela de medidas na página do produto: confira antes de comprar e, em caso de dúvida, fale com a gente pelo WhatsApp.",
        "DIREITO DE DESISTÊNCIA: como toda compra pela internet (art. 49 do Código de Defesa do Consumidor), você pode desistir da compra em até 7 dias corridos após o recebimento. A peça deve voltar sem uso, sem lavagem e com a etiqueta. O frete de devolução é por conta da cliente. Depois que recebermos e conferirmos a peça, devolvemos o valor pago pela mesma forma de pagamento.",
        "DEFEITO DE FABRICAÇÃO: se a peça chegar com defeito, avise-nos pelo WhatsApp em até 90 dias após o recebimento, com fotos. Nesse caso, a Ciranda Cirandinha paga o frete e faz a troca pela mesma peça ou devolve o valor pago.",
        "Para troca, desistência ou defeito, entre em contato pelo WhatsApp informando o número do pedido."
      ]
    },
    perguntas: {
      title: "Perguntas frequentes",
      paragraphs: ["Separamos as dúvidas mais comuns. Se a sua não estiver aqui, é só chamar a gente no WhatsApp."],
      faq: [
        { q: "Onde ficam as lojas físicas?", a: "Temos lojas em Espinosa e em Montes Claros, em Minas Gerais. Você pode comprar pelo site e retirar o pedido em uma delas, sem custo de frete." },
        { q: "Quais tamanhos vocês têm?", a: "Vestimos do recém-nascido ao juvenil (até 18 anos). Os tamanhos de cada peça aparecem na página do produto." },
        { q: "Qual o prazo de envio?", a: "Os pedidos são postados em até 1 dia útil após a confirmação do pagamento. Pedidos confirmados depois das 16h são postados no próximo dia útil. O prazo de entrega da transportadora aparece quando você calcula o frete no carrinho." },
        { q: "Quais as formas de pagamento?", a: "As formas de pagamento disponíveis aparecem ao finalizar o pedido. Se preferir, também dá para finalizar pelo WhatsApp e combinar o pagamento com a gente." },
        { q: "Tem frete grátis?", a: "Sim! Acima de um valor mínimo em produtos, o frete sai de graça. O carrinho mostra quanto falta para você ganhar o frete grátis." },
        { q: "Como escolho o tamanho certo?", a: "Cada peça tem uma tabela de medidas na página do produto. Compare com as medidas de uma roupa que já sirva bem. Ficou na dúvida? Chame a gente no WhatsApp antes de comprar." },
        { q: "Posso trocar se o tamanho não servir?", a: "Pode. A troca por outro tamanho do mesmo modelo pode ser pedida em até 7 dias após o recebimento, conforme o estoque. A peça deve voltar sem uso, sem lavagem e com a etiqueta, e o frete da troca é por conta da cliente." },
        { q: "E se eu me arrepender da compra?", a: "Você pode desistir em até 7 dias após o recebimento, como em toda compra pela internet. A peça volta sem uso e com etiqueta, e devolvemos o valor pago pela mesma forma de pagamento. Veja os detalhes em Trocas, devoluções e envio." },
        { q: "Como acompanho meu pedido?", a: "Clique em Meu pedido, no menu do site, e digite o número do pedido e o e-mail ou telefone usado na compra. Também mandamos o link de acompanhamento pelo WhatsApp a cada etapa." },
        { q: "Onde uso meu cupom de desconto?", a: "No carrinho, no campo de cupom, antes de finalizar o pedido. O desconto vale sobre os produtos, não sobre o frete." }
      ]
    },
    privacidade: {
      title: "Política de privacidade",
      paragraphs: [
        "Esta página explica quais dados a Ciranda Cirandinha coleta no site, para que usa e quais são os seus direitos, de acordo com a Lei Geral de Proteção de Dados (LGPD).",
        "DADOS QUE COLETAMOS: nome, WhatsApp, e-mail e endereço de entrega informados no pedido, além dos itens comprados. Quando você preenche nome e WhatsApp no checkout, guardamos o carrinho para poder te ajudar caso a compra não seja concluída. Se você pedir para ser avisada quando um tamanho chegar, guardamos seu nome e WhatsApp para esse aviso. Se assinar a newsletter, guardamos seu e-mail. Nas avaliações, seu nome, comentário e fotos ficam públicos na página do produto depois de aprovados.",
        "PARA QUE USAMOS: processar, entregar e acompanhar pedidos, falar com você sobre a compra pelo WhatsApp, enviar avisos que você pediu e, se você assinou, novidades e promoções por e-mail. Não vendemos seus dados.",
        "COM QUEM COMPARTILHAMOS: só com quem precisa para a compra acontecer: a empresa de pagamento, o Melhor Envio e as transportadoras (entrega), a Brevo (envio da newsletter) e a Vercel (hospedagem do site). Os dados do cartão são digitados diretamente na empresa de pagamento; a Ciranda Cirandinha não tem acesso ao número do cartão.",
        "ESTATÍSTICAS DO SITE: contamos visitas, cliques e de onde as visitas vêm (por exemplo, Instagram ou Google) apenas em números totais, sem identificar quem visitou. Carrinho e favoritos ficam guardados no seu próprio navegador.",
        "SEUS DIREITOS: você pode pedir para ver, corrigir ou apagar seus dados a qualquer momento pelo nosso WhatsApp. Para sair da newsletter, use o link de descadastro no final de qualquer e-mail. Dados de pedidos podem ser mantidos pelo tempo exigido por lei para fins fiscais."
      ]
    }
  }
};

export default cirandaCirandinha;
