import type { StoreConfig } from "./types";

const faseTeen: StoreConfig = {
  id: "fase-teen",
  name: "Fase Teen",
  siteUrl: "https://www.faseteen.com.br",

  meta: {
    title: "Fase Teen | Nova coleção de moda teen feminina",
    description: "Fase Teen é moda teen feminina com qualidade de verdade: tecidos escolhidos a dedo, acabamento caprichado e peças que acompanham cada fase. Conheça a nova coleção."
  },

  // Cores tiradas da marca oficial: roxo do nome, laranja do F, lilás do T e rosas do fundo.
  theme: {
    primary: "#9a4ea6",
    primaryDark: "#7a3d8c",
    primarySoft: "#f8eef6",
    primaryLight: "#ebb8d6",
    accent: "#f08a3c",
    logoText: "#7a3d8c",
    logoSubText: "#7a3d8c",
    ink: "#2e1b35",
    heroGradient: ["#fde6d6", "#f9e8f1", "#ecdcf3"],
    cardGradient: ["#f39a58", "#a256ad"],
    cardBackGradient: ["#f7c7aa", "#dcc2ea"],
    fonts: {
      googleFontsUrl: "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Lato:wght@700;900&family=Nunito:wght@700;800;900&display=swap",
      heading: "\"Nunito\", \"DM Sans\", Arial, sans-serif",
      body: "\"DM Sans\", Arial, sans-serif",
      logo: "\"Lato\", \"DM Sans\", Arial, sans-serif"
    }
  },

  logo: {
    main: "FASE",
    sub: "teen",
    subAlign: "right",
    icon: "/brand/fase-teen-icon.png",
    monogram: "FT"
  },

  contact: {
    whatsapp: "5538998286040",
    instagramUrl: "https://instagram.com/faseteen",
    instagramHandle: "@faseteen"
  },

  commerce: {
    installments: 3,
    shippingNote: "Enviado em até 1 dia útil. Pedidos feitos depois das 16h são postados no próximo dia útil.",
    sizeChartNote: "Confira as medidas antes de comprar. Se o tamanho não servir, você pode trocar por outro em até 7 dias após receber (o frete da troca é por conta da cliente).",
    returnDays: 7
  },

  texts: {
    topbar: "NOVA COLEÇÃO NO AR • ENVIO PARA TODO O BRASIL • POSTAGEM EM ATÉ 1 DIA ÚTIL",
    nav: { home: "Início", news: "Lançamentos", collection: "Coleção", about: "A marca" },
    hero: {
      eyebrow: "NOVA COLEÇÃO • FASE TEEN",
      title: "Qualidade que acompanha cada fase.",
      text: "A nova coleção Fase Teen chegou. Peças femininas com tecido escolhido a dedo, acabamento caprichado e caimento pensado para meninas que estão criando o próprio estilo.",
      primaryCta: "Ver a nova coleção",
      secondaryCta: "Lançamentos",
      pill: "NOVA",
      image: "/brand/fase-teen-logo.webp",
      cardTop: "FASE",
      cardBottom: "teen",
      cardCaption: "Moda teen feminina"
    },
    benefits: [
      { icon: "hanger", title: "Qualidade em cada peça", text: "Tecidos que valem o que custam e acabamento bem-feito." },
      { icon: "ruler", title: "Tabela de medidas", text: "Medidas de cada peça para acertar o tamanho de primeira." },
      { icon: "truck", title: "Envio para todo o Brasil", text: "Postagem em até 1 dia útil após a confirmação." },
      { icon: "lock", title: "Compra segura", text: "Pague no Pix ou no cartão pelo Mercado Pago." }
    ],
    featured: { eyebrow: "LANÇAMENTO", title: "Chegou a nova coleção", link: "Ver todas as peças →" },
    banner: {
      eyebrow: "POR QUE FASE TEEN",
      title: "Roupa bonita que continua bonita.",
      text: "Cada peça é pensada nos detalhes: tecido de qualidade, costura bem-feita e modelagem confortável para o dia a dia. É roupa para usar muito, lavar muito e continuar gostando.",
      cta: "Conhecer a coleção",
      stickers: ["qualidade", "conforto", "estilo", "teen"]
    },
    catalog: {
      eyebrow: "COLEÇÃO",
      title: "Escolha sua próxima peça favorita",
      searchPlaceholder: "Buscar por peça, cor ou categoria..."
    },
    about: {
      eyebrow: "A MARCA",
      title: "Uma marca feita para essa fase.",
      paragraphs: [
        "A Fase Teen nasceu para vestir meninas numa das fases mais cheias de descobertas da vida. Acreditamos que roupa boa é a que acompanha: veste bem, é confortável no dia a dia e continua bonita depois de muitas lavagens.",
        "Por isso, qualidade está no centro de tudo o que fazemos. Escolhemos tecidos que valem o que custam, cuidamos de cada acabamento e pensamos a modelagem para quem está crescendo. A nova coleção é o resultado desse cuidado, e é só o começo."
      ],
      cta: "Ver a nova coleção"
    },
    newsletter: { eyebrow: "FAÇA PARTE", title: "Seja a primeira a saber dos lançamentos." },
    footer: { tagline: "Moda teen feminina com qualidade para acompanhar cada fase." },
    checkout: {
      intro: "Preencha seus dados. Ao continuar, o pedido será enviado para o WhatsApp da Fase Teen para confirmação de estoque, entrega e pagamento."
    },
    whatsappGreeting: "Olá! Vim pelo site da Fase Teen e gostaria de atendimento."
  },

  pages: {
    trocas: {
      title: "Trocas, devoluções e envio",
      paragraphs: [
        "PRAZO DE ENVIO: os pedidos são postados em até 1 dia útil após a confirmação do pagamento. Pedidos confirmados depois das 16h são postados no próximo dia útil. O prazo de entrega da transportadora começa a contar a partir da postagem e aparece no cálculo do frete.",
        "TROCA POR TAMANHO: você pode trocar a peça por outro tamanho do mesmo modelo em até 7 dias corridos após o recebimento, conforme a disponibilidade em estoque. A peça deve voltar sem uso, sem lavagem e com a etiqueta. O frete para enviar a peça e para receber o novo tamanho é por conta da cliente. Para acertar de primeira, cada peça tem uma tabela de medidas na página do produto: confira antes de comprar e, em caso de dúvida, fale com a gente pelo WhatsApp.",
        "DIREITO DE DESISTÊNCIA: como toda compra pela internet (art. 49 do Código de Defesa do Consumidor), você pode desistir da compra em até 7 dias corridos após o recebimento. A peça deve voltar sem uso, sem lavagem e com a etiqueta. O frete de devolução é por conta da cliente. Depois que recebermos e conferirmos a peça, devolvemos o valor pago pela mesma forma de pagamento.",
        "DEFEITO DE FABRICAÇÃO: se a peça chegar com defeito, avise-nos pelo WhatsApp em até 90 dias após o recebimento, com fotos. Nesse caso, a Fase Teen paga o frete e faz a troca pela mesma peça ou devolve o valor pago.",
        "Para desistência ou defeito, entre em contato pelo WhatsApp informando o número do pedido."
      ]
    },
    perguntas: {
      title: "Perguntas frequentes",
      paragraphs: ["Separamos as dúvidas mais comuns. Se a sua não estiver aqui, é só chamar a gente no WhatsApp."],
      faq: [
        { q: "Qual o prazo de envio?", a: "Os pedidos são postados em até 1 dia útil após a confirmação do pagamento. Pedidos confirmados depois das 16h são postados no próximo dia útil. O prazo de entrega da transportadora aparece quando você calcula o frete no carrinho." },
        { q: "Quais as formas de pagamento?", a: "Você pode pagar no site pelo Mercado Pago, com Pix (com preço menor) ou cartão de crédito em até 3x. Se preferir, também dá para finalizar pelo WhatsApp e combinar o pagamento com a gente." },
        { q: "Tem frete grátis?", a: "Sim! Acima de um valor mínimo em produtos o frete sai de graça. O carrinho mostra quanto falta para você ganhar o frete grátis." },
        { q: "Como escolho o tamanho certo?", a: "Cada peça tem uma tabela de medidas na página do produto. Compare com as medidas de uma roupa que já sirva bem. Ficou na dúvida? Chame a gente no WhatsApp antes de comprar." },
        { q: "Posso trocar se o tamanho não servir?", a: "Pode. A troca por outro tamanho do mesmo modelo pode ser pedida em até 7 dias após o recebimento, conforme o estoque. A peça deve voltar sem uso, sem lavagem e com a etiqueta, e o frete da troca é por conta da cliente." },
        { q: "E se eu me arrepender da compra?", a: "Você pode desistir em até 7 dias após o recebimento, como em toda compra pela internet. A peça volta sem uso e com etiqueta, e devolvemos o valor pago pela mesma forma de pagamento. Veja os detalhes em Trocas, devoluções e envio." },
        { q: "Como acompanho meu pedido?", a: "Clique em Meu pedido, no menu do site, e digite o número do pedido e o e-mail ou telefone usado na compra. Também mandamos o link de acompanhamento pelo WhatsApp a cada etapa." },
        { q: "Onde uso meu cupom de desconto?", a: "No carrinho, no campo de cupom, antes de finalizar o pedido. O desconto vale sobre os produtos, não sobre o frete." }
      ]
    },
    privacidade: {
      title: "Política de privacidade",
      paragraphs: ["EDITE: descreva aqui como a Fase Teen trata os dados dos clientes."]
    }
  }
};

export default faseTeen;
