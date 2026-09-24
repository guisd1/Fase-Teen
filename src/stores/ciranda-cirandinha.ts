import type { StoreConfig } from "./types";

/*
  Configuração da Ciranda Cirandinha.
  Os textos, cores e contatos abaixo são provisórios: troque tudo que
  estiver marcado com "EDITE" pelos dados reais da loja.
*/
const cirandaCirandinha: StoreConfig = {
  id: "ciranda-cirandinha",
  name: "Ciranda Cirandinha",
  siteUrl: "https://ciranda-cirandinha.vercel.app", // EDITE com o domínio real do projeto na Vercel

  meta: {
    title: "Ciranda Cirandinha | Moda Infantil",
    description: "Ciranda Cirandinha — moda infantil com carinho, conforto e alegria." // EDITE
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
    monogram: "CC"
  },

  contact: {
    whatsapp: "550000000000", // EDITE: DDI + DDD + número, somente números
    instagramUrl: "https://instagram.com/", // EDITE
    instagramHandle: "@cirandacirandinha" // EDITE
  },

  commerce: {
    installments: 3
  },

  texts: {
    topbar: "LOJA FÍSICA E ONLINE • RETIRADA NA LOJA • ATENDIMENTO PELO WHATSAPP",
    nav: { home: "Início", news: "Novidades", collection: "Coleção", about: "Sobre a loja" },
    hero: {
      eyebrow: "NOVA COLEÇÃO • CIRANDA CIRANDINHA",
      title: "Roupinhas para brincar de ser feliz.",
      text: "Peças confortáveis e cheias de cor para acompanhar cada brincadeira.", // EDITE
      primaryCta: "Comprar agora",
      secondaryCta: "Ver novidades",
      pill: "NOVO",
      image: "/brand/ciranda-cirandinha.png", // logo provisório
      cardTop: "CIRANDA",
      cardBottom: "KIDS",
      cardCaption: "Moda infantil"
    },
    benefits: [
      { icon: "🏬", title: "Loja física", text: "Retire seu pedido na loja sem custo." },
      { icon: "🚚", title: "Envio para todo o Brasil", text: "Escolha a melhor opção de entrega no checkout." },
      { icon: "💬", title: "Atendimento rápido", text: "Fale com a gente pelo WhatsApp." },
      { icon: "🧸", title: "Feito para brincar", text: "Tecidos macios e confortáveis." }
    ],
    featured: { eyebrow: "PARA COMEÇAR", title: "Novidades que chegaram", link: "Ver coleção →" },
    banner: {
      eyebrow: "CIRANDA CIRANDINHA",
      title: "Do dia a dia à festinha.",
      text: "Looks para escola, passeios, aniversários e todas as aventuras da infância.", // EDITE
      cta: "Explorar produtos",
      stickers: ["colorido", "conforto", "brincar", "kids"]
    },
    catalog: {
      eyebrow: "CATÁLOGO",
      title: "Encontre o look perfeito",
      searchPlaceholder: "Buscar por produto, cor ou categoria..."
    },
    about: {
      eyebrow: "SOBRE A LOJA",
      title: "Ciranda Cirandinha é vestir a infância.",
      paragraphs: [
        "EDITE: conte aqui a história da Ciranda Cirandinha, onde fica a loja física e o que torna ela especial."
      ],
      cta: "Conhecer a coleção"
    },
    newsletter: { eyebrow: "FIQUE POR DENTRO", title: "Receba novidades e ofertas." },
    footer: { tagline: "Moda infantil com carinho." }, // EDITE
    checkout: {
      intro: "Preencha seus dados. Ao continuar, o pedido será enviado para o WhatsApp da Ciranda Cirandinha para confirmação de estoque, entrega e pagamento."
    },
    whatsappGreeting: "Olá! Vim pelo site da Ciranda Cirandinha e gostaria de atendimento."
  },

  pages: {
    trocas: {
      title: "Trocas e devoluções",
      paragraphs: ["EDITE: descreva aqui a política de trocas e devoluções da Ciranda Cirandinha."]
    },
    privacidade: {
      title: "Política de privacidade",
      paragraphs: ["EDITE: descreva aqui como a Ciranda Cirandinha trata os dados dos clientes."]
    }
  }
};

export default cirandaCirandinha;
