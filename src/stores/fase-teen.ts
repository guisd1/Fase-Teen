import type { StoreConfig } from "./types";

const faseTeen: StoreConfig = {
  id: "fase-teen",
  name: "Fase Teen",
  siteUrl: "https://fase-teen.vercel.app",

  meta: {
    title: "Fase Teen | Moda Infantil Feminina",
    description: "Fase Teen — moda infantil feminina para meninas que estão vivendo cada fase com estilo."
  },

  theme: {
    primary: "#d94f86",
    primaryDark: "#b83d6d",
    primarySoft: "#f8e9ef",
    primaryLight: "#f6aac6",
    ink: "#171317",
    heroGradient: ["#f7dce7", "#f7e9ee", "#f5d3e1"],
    cardGradient: ["#cf6a95", "#b74676"],
    cardBackGradient: ["#f0bdd1", "#e4d8ed"],
    fonts: {
      googleFontsUrl: "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@500;600;700&display=swap",
      heading: "\"Playfair Display\", Georgia, serif",
      body: "\"DM Sans\", Arial, sans-serif"
    }
  },

  logo: {
    main: "Fase",
    sub: "TEEN",
    monogram: "FT"
  },

  contact: {
    whatsapp: "5538998286040",
    instagramUrl: "https://instagram.com/faseteen",
    instagramHandle: "@faseteen"
  },

  commerce: {
    installments: 3
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
      cardBottom: "TEEN",
      cardCaption: "Moda infantil feminina"
    },
    benefits: [
      { icon: "🚚", title: "Envio para todo o Brasil", text: "Escolha a melhor opção de entrega no checkout." },
      { icon: "🔒", title: "Compra segura", text: "Seus dados são tratados com cuidado." },
      { icon: "💬", title: "Atendimento rápido", text: "Fale com a gente pelo WhatsApp." },
      { icon: "✨", title: "Peças selecionadas", text: "Moda feminina pensada para cada fase." }
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
      title: "Trocas e devoluções",
      paragraphs: ["EDITE: descreva aqui a política de trocas e devoluções da Fase Teen."]
    },
    privacidade: {
      title: "Política de privacidade",
      paragraphs: ["EDITE: descreva aqui como a Fase Teen trata os dados dos clientes."]
    }
  }
};

export default faseTeen;
