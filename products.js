/*
  CATÁLOGO DA FASE TEEN
  Este arquivo é carregado como JavaScript comum para funcionar tanto
  ao abrir o index.html localmente quanto depois de publicar o site.

  Edite os produtos abaixo para trocar nome, preço, tamanhos, cores,
  mídia (imagens/vídeo) e os dados de peso/dimensões usados no frete.

  CAMPO "media" (carrossel do produto):
  Cada produto pode ter várias imagens e, opcionalmente, um vídeo.
  O carrossel do card e da tela "Ver produto" usa esta lista, na ordem
  em que ela aparece. Formato de cada item:
    { type: "image", src: "caminho/da/imagem.jpg" }
    { type: "video", src: "caminho/do/video.mp4" }
  Coloque os arquivos dentro de assets/products/ e referencie o caminho
  aqui. Pode ter quantas imagens quiser; o vídeo geralmente fica por
  último na lista.

  CAMPO "reference": código/SKU do produto (aparece no card e na tela
  de detalhes). Edite com o código real de cada peça.

  CAMPO "composition": composição do tecido e outros detalhes do
  produto (aparece na tela "Ver produto"). Edite com o texto real.
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
    media: [
      { type: "image", src: "assets/products/produto-01.svg" },
      { type: "image", src: "assets/products/produto-01.svg" }
      // Exemplo de como adicionar mais mídia:
      // { type: "image", src: "assets/products/produto-01-b.jpg" },
      // { type: "video", src: "assets/products/produto-01.mp4" }
    ],
    reference: "FT-1001",
    featured: true,
    badge: "NOVO",
    description: "Conjunto feminino com proposta moderna e confortável para o dia a dia.",
    composition: "96% Algodão, 4% Elastano. Lavar à mão ou máquina em ciclo delicado, não usar alvejante. — EDITE com a composição real desta peça.",
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
    media: [
      { type: "image", src: "assets/products/produto-02.svg" },
      { type: "image", src: "assets/products/produto-02.svg" }
    ],
    reference: "FT-1002",
    featured: true,
    badge: "DESTAQUE",
    description: "Vestido leve e feminino, perfeito para passeios e momentos especiais.",
    composition: "94% Viscose, 6% Elastano. Lavar à mão, não torcer. — EDITE com a composição real desta peça.",
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
    media: [
      { type: "image", src: "assets/products/produto-03.svg" },
      { type: "image", src: "assets/products/produto-03.svg" }
    ],
    reference: "FT-1003",
    featured: true,
    badge: "OFERTA",
    description: "Saia jeans versátil para combinar com diferentes estilos.",
    composition: "98% Algodão, 2% Elastano. Lavar à máquina em água fria. — EDITE com a composição real desta peça.",
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
    media: [
      { type: "image", src: "assets/products/produto-04.svg" },
      { type: "image", src: "assets/products/produto-04.svg" }
    ],
    reference: "FT-1004",
    featured: false,
    badge: "",
    description: "Blusa fácil de combinar, com caimento leve e visual delicado.",
    composition: "100% Algodão. Lavar à máquina, cores separadas. — EDITE com a composição real desta peça.",
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
    media: [
      { type: "image", src: "assets/products/produto-05.svg" },
      { type: "image", src: "assets/products/produto-05.svg" }
    ],
    reference: "FT-1005",
    featured: true,
    badge: "TREND",
    description: "Modelagem wide leg para um look atual e confortável.",
    composition: "97% Algodão, 3% Elastano. Não usar secadora. — EDITE com a composição real desta peça.",
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
    media: [
      { type: "image", src: "assets/products/produto-06.svg" },
      { type: "image", src: "assets/products/produto-06.svg" }
    ],
    reference: "FT-1006",
    featured: false,
    badge: "",
    description: "Peça curinga para criar diferentes combinações.",
    composition: "95% Algodão, 5% Elastano. Lavar à mão ou ciclo delicado. — EDITE com a composição real desta peça.",
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
    media: [
      { type: "image", src: "assets/products/produto-07.svg" },
      { type: "image", src: "assets/products/produto-07.svg" }
    ],
    reference: "FT-1007",
    featured: false,
    badge: "CONFORTO",
    description: "Conjunto confortável para dias mais frescos e looks casuais.",
    composition: "80% Algodão, 20% Poliéster. Lavar à máquina, não usar alvejante. — EDITE com a composição real desta peça.",
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
    media: [
      { type: "image", src: "assets/products/produto-08.svg" },
      { type: "image", src: "assets/products/produto-08.svg" }
    ],
    reference: "FT-1008",
    featured: false,
    badge: "OFERTA",
    description: "Shorts jeans de modelagem confortável para o dia a dia.",
    composition: "99% Algodão, 1% Elastano. Lavar à máquina em água fria. — EDITE com a composição real desta peça.",
    shipping: { weight: 0.32, height: 6, width: 23, length: 28 }
  }
];

window.storeConfig = {
  brand: "Fase Teen",
  whatsapp: "5538998286040", // TROQUE pelo número da loja com DDI + DDD, somente números.
  instagram: "https://instagram.com/faseteen", // TROQUE pelo Instagram oficial.
  instagramHandle: "@faseteen",
  currency: "BRL"
};
