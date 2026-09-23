/*
  CATÁLOGO DA FASE TEEN
  Este arquivo é carregado como JavaScript comum para funcionar tanto
  ao abrir o index.html localmente quanto depois de publicar o site.

  Edite os produtos abaixo para trocar nome, preço, tamanhos, cores,
  imagem e os dados de peso/dimensões usados no frete.
*/
window.products = [
  {
    id: 1,
    name: "Conjunto Cropped + Saia Jeans",
    category: "Conjuntos",
    price: 89.90,
    oldPrice: 119.90,
    sizes: ["10","12","14","16"],
    colors: ["Rosa","Jeans"],
    image: "assets/products/produto-01.svg",
    featured: true,
    badge: "NOVO",
    description: "Conjunto feminino com proposta moderna e confortável para o dia a dia.",
    shipping: { weight: 0.45, height: 8, width: 25, length: 32 }
  },
  {
    id: 2,
    name: "Vestido Floral Teen",
    category: "Vestidos",
    price: 79.90,
    oldPrice: null,
    sizes: ["10","12","14","16"],
    colors: ["Floral"],
    image: "assets/products/produto-02.svg",
    featured: true,
    badge: "DESTAQUE",
    description: "Vestido leve e feminino, perfeito para passeios e momentos especiais.",
    shipping: { weight: 0.35, height: 6, width: 23, length: 32 }
  },
  {
    id: 3,
    name: "Saia Jeans Básica",
    category: "Saias",
    price: 59.90,
    oldPrice: 69.90,
    sizes: ["10","12","14","16"],
    colors: ["Jeans"],
    image: "assets/products/produto-03.svg",
    featured: true,
    badge: "OFERTA",
    description: "Saia jeans versátil para combinar com diferentes estilos.",
    shipping: { weight: 0.35, height: 6, width: 23, length: 28 }
  },
  {
    id: 4,
    name: "Blusa Básica com Detalhe",
    category: "Blusas",
    price: 39.90,
    oldPrice: null,
    sizes: ["8","10","12","14","16"],
    colors: ["Off-white","Rosa"],
    image: "assets/products/produto-04.svg",
    featured: false,
    badge: "",
    description: "Blusa fácil de combinar, com caimento leve e visual delicado.",
    shipping: { weight: 0.22, height: 5, width: 22, length: 28 }
  },
  {
    id: 5,
    name: "Calça Wide Leg Teen",
    category: "Calças",
    price: 89.90,
    oldPrice: 99.90,
    sizes: ["10","12","14","16"],
    colors: ["Jeans"],
    image: "assets/products/produto-05.svg",
    featured: true,
    badge: "TREND",
    description: "Modelagem wide leg para um look atual e confortável.",
    shipping: { weight: 0.55, height: 8, width: 25, length: 34 }
  },
  {
    id: 6,
    name: "Cropped Teen Básico",
    category: "Blusas",
    price: 34.90,
    oldPrice: null,
    sizes: ["10","12","14","16"],
    colors: ["Preto","Rosa","Branco"],
    image: "assets/products/produto-06.svg",
    featured: false,
    badge: "",
    description: "Peça curinga para criar diferentes combinações.",
    shipping: { weight: 0.18, height: 5, width: 20, length: 25 }
  },
  {
    id: 7,
    name: "Conjunto Moletom Trend",
    category: "Conjuntos",
    price: 99.90,
    oldPrice: null,
    sizes: ["10","12","14","16"],
    colors: ["Lilás"],
    image: "assets/products/produto-07.svg",
    featured: false,
    badge: "CONFORTO",
    description: "Conjunto confortável para dias mais frescos e looks casuais.",
    shipping: { weight: 0.70, height: 10, width: 27, length: 34 }
  },
  {
    id: 8,
    name: "Shorts Jeans Mom",
    category: "Shorts",
    price: 54.90,
    oldPrice: 64.90,
    sizes: ["10","12","14","16"],
    colors: ["Jeans"],
    image: "assets/products/produto-08.svg",
    featured: false,
    badge: "OFERTA",
    description: "Shorts jeans de modelagem confortável para o dia a dia.",
    shipping: { weight: 0.32, height: 6, width: 23, length: 28 }
  }
];

window.storeConfig = {
  brand: "Fase Teen",
  whatsapp: "5500000000000", // TROQUE pelo número da loja com DDI + DDD, somente números.
  instagram: "https://instagram.com/faseteen", // TROQUE pelo Instagram oficial.
  instagramHandle: "@faseteen",
  currency: "BRL"
};
