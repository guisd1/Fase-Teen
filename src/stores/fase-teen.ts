import type { StoreConfig } from "./types";

const faseTeen: StoreConfig = {
  id: "fase-teen",
  name: "Fase Teen",
  siteUrl: "https://www.faseteen.com.br",

  meta: {
    title: "Fase Teen | Moda Infantil Feminina",
    description: "Fase Teen — moda infantil feminina para meninas que estão vivendo cada fase com estilo."
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
    icon: "/brand/fase-teen-icon.svg",
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
    returnDays: 7
  },

  texts: {
    topbar: "ENVIO PARA TODO O BRASIL • COMPRA SEGURA • ATENDIMENTO PELO WHATSAPP",
    nav: { home: "Início", news: "Novidades", collection: "Coleção", about: "Sobre a Fase Teen" },
    hero: {
      eyebrow: "NOVA COLEÇÃO • FASE TEEN",
      title: "Estilo para cada fase.",
      text: "Looks femininos, atuais e confortáveis para meninas que querem se vestir do seu jeitinho.",
      primaryCta: "Comprar agora",
      secondaryCta: "Ver novidades",
      pill: "NEW",
      cardTop: "FASE",
      cardBottom: "teen",
      cardCaption: "Moda infantil feminina"
    },
    benefits: [
      { icon: "truck", title: "Envio para todo o Brasil", text: "Escolha a melhor opção de entrega no checkout." },
      { icon: "lock", title: "Compra segura", text: "Seus dados são tratados com cuidado." },
      { icon: "chat", title: "Atendimento rápido", text: "Fale com a gente pelo WhatsApp." },
      { icon: "hanger", title: "Peças selecionadas", text: "Moda feminina pensada para cada fase." }
    ],
    featured: { eyebrow: "PARA COMEÇAR", title: "Novidades que chegaram", link: "Ver coleção →" },
    banner: {
      eyebrow: "FASE TEEN",
      title: "Do básico ao look que chama atenção.",
      text: "Monte combinações para escola, passeios, festas e todos os momentos da adolescência.",
      cta: "Explorar produtos",
      stickers: ["casual", "trend", "cute", "teen"]
    },
    catalog: {
      eyebrow: "CATÁLOGO",
      title: "Encontre seu próximo look",
      searchPlaceholder: "Buscar por produto, cor ou categoria..."
    },
    about: {
      eyebrow: "SOBRE A MARCA",
      title: "Fase Teen é vestir cada momento.",
      paragraphs: [
        "A Fase Teen nasceu para acompanhar meninas em uma fase cheia de descobertas. Nossa proposta é unir estilo, conforto e peças que façam sentido para a rotina, deixando espaço para cada uma construir seu próprio jeito de se expressar."
      ],
      cta: "Conhecer a coleção"
    },
    newsletter: { eyebrow: "FIQUE POR DENTRO", title: "Receba novidades e ofertas." },
    footer: { tagline: "Moda infantil feminina para cada fase." },
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
        "TROCAS POR TAMANHO: não fazemos trocas por tamanho, modelo ou cor. Por isso, cada peça tem uma tabela de medidas na página do produto: confira as medidas antes de finalizar a compra. Em caso de dúvida, fale com a gente pelo WhatsApp antes de comprar.",
        "DIREITO DE DESISTÊNCIA: como toda compra pela internet (art. 49 do Código de Defesa do Consumidor), você pode desistir da compra em até 7 dias corridos após o recebimento. A peça deve voltar sem uso, sem lavagem e com a etiqueta. O frete de devolução é por conta da cliente. Depois que recebermos e conferirmos a peça, devolvemos o valor pago pela mesma forma de pagamento.",
        "DEFEITO DE FABRICAÇÃO: se a peça chegar com defeito, avise-nos pelo WhatsApp em até 90 dias após o recebimento, com fotos. Nesse caso, a Fase Teen paga o frete e faz a troca pela mesma peça ou devolve o valor pago.",
        "Para desistência ou defeito, entre em contato pelo WhatsApp informando o número do pedido."
      ]
    },
    privacidade: {
      title: "Política de privacidade",
      paragraphs: ["EDITE: descreva aqui como a Fase Teen trata os dados dos clientes."]
    }
  }
};

export default faseTeen;
