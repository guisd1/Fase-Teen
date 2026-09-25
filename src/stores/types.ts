/*
  Tudo o que muda de uma loja para outra fica em um arquivo de marca
  (src/stores/<loja>.ts) que segue este formato. O restante do código
  (layout, carrinho, frete, checkout) é igual para todas as lojas.
*/

export interface Benefit {
  icon: string;
  title: string;
  text: string;
}

export interface InstitutionalPage {
  title: string;
  /** Cada item vira um parágrafo. */
  paragraphs: string[];
}

export interface StoreConfig {
  /** Identificador técnico. Deve ser igual ao valor da variável STORE na Vercel. */
  id: string;
  /** Nome exibido no site e na mensagem do WhatsApp. */
  name: string;
  /** Endereço público do site (sem barra no final). Usado no callback do Melhor Envio. */
  siteUrl: string;

  meta: {
    title: string;
    description: string;
  };

  theme: {
    /** Cor principal (botões de destaque, links, detalhes). */
    primary: string;
    /** Versão mais escura da cor principal (textos em destaque). */
    primaryDark: string;
    /** Versão bem clara da cor principal (fundos suaves). */
    primarySoft: string;
    /** Versão clara usada sobre fundo escuro (rodapé, banner). */
    primaryLight: string;
    /** Cor secundária de destaque (segunda parte do logo em texto). */
    accent: string;
    /** Cor da parte principal do logo em texto. */
    logoText: string;
    /** Cor de texto e fundos escuros. */
    ink: string;
    /** Degradê do bloco principal (hero): [início, meio, fim]. */
    heroGradient: [string, string, string];
    /** Degradê do cartão da frente no hero: [início, fim]. */
    cardGradient: [string, string];
    /** Degradê do cartão de trás no hero: [início, fim]. */
    cardBackGradient: [string, string];
    fonts: {
      /** URL do Google Fonts com as fontes usadas abaixo. */
      googleFontsUrl: string;
      heading: string;
      body: string;
    };
  };

  logo: {
    /** Se preenchido, mostra esta imagem (ex.: "/brand/logo.png" dentro de public/) no lugar do logo em texto. */
    image?: string;
    /** Parte principal do logo em texto. */
    main: string;
    /** Parte menor, abaixo da principal. */
    sub: string;
    /** Sigla usada no bloco "Sobre". */
    monogram: string;
  };

  contact: {
    /** DDI + DDD + número, somente números. */
    whatsapp: string;
    email?: string;
    instagramUrl?: string;
    instagramHandle?: string;
  };

  commerce: {
    /** Número de parcelas exibido no card do produto ("ou 3x de ..."). */
    installments: number;
    /** Prazo de postagem mostrado na página do produto. */
    shippingNote?: string;
    /** Dias para desistir da compra (art. 49 do CDC: mínimo 7). Vai para o Google. */
    returnDays?: number;
  };

  texts: {
    topbar: string;
    nav: { home: string; news: string; collection: string; about: string };
    hero: {
      eyebrow: string;
      title: string;
      text: string;
      primaryCta: string;
      secondaryCta: string;
      pill: string;
      /** Se preenchido, mostra esta imagem (dentro de public/) no lugar do cartão com o nome da loja. */
      image?: string;
      cardTop: string;
      cardBottom: string;
      cardCaption: string;
    };
    benefits: Benefit[];
    featured: { eyebrow: string; title: string; link: string };
    banner: { eyebrow: string; title: string; text: string; cta: string; stickers: string[] };
    catalog: { eyebrow: string; title: string; searchPlaceholder: string };
    about: { eyebrow: string; title: string; paragraphs: string[]; cta: string };
    newsletter: { eyebrow: string; title: string };
    footer: { tagline: string };
    checkout: { intro: string };
    /** Mensagem inicial do botão flutuante do WhatsApp. */
    whatsappGreeting: string;
  };

  /** Páginas institucionais, acessadas em /institucional/<chave>. */
  pages: Record<string, InstitutionalPage>;
}
