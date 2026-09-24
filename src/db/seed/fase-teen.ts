import type { NewProductRow } from "../schema";

/*
  Produtos iniciais da Fase Teen, gravados no banco por `npm run db:seed`.
  Depois de gravados, edite os produtos direto no banco (ou, futuramente,
  pelo painel de administrador). Este arquivo não é mais lido pelo site.
*/
const seed: NewProductRow[] = [
  {
    name: "Conjunto Cropped + Saia Jeans",
    category: "Conjuntos",
    price: 89.9,
    oldPrice: 119.9,
    sizes: ["10", "12", "14", "16"],
    colors: ["Rosa", "Jeans"],
    media: [
      { type: "image", src: "/assets/products/produto-01.svg" },
      { type: "image", src: "/assets/products/produto-01.svg" }
    ],
    reference: "FT-1001",
    featured: true,
    badge: "NOVO",
    description: "Conjunto feminino com proposta moderna e confortável para o dia a dia.",
    composition: "96% Algodão, 4% Elastano. Lavar à mão ou máquina em ciclo delicado, não usar alvejante. — EDITE com a composição real desta peça.",
    weightKg: 0.45, heightCm: 8, widthCm: 25, lengthCm: 32
  },
  {
    name: "Vestido Floral Teen",
    category: "Vestidos",
    price: 79.9,
    oldPrice: null,
    sizes: ["10", "12", "14", "16"],
    colors: ["Floral"],
    media: [
      { type: "image", src: "/assets/products/produto-02.svg" },
      { type: "image", src: "/assets/products/produto-02.svg" }
    ],
    reference: "FT-1002",
    featured: true,
    badge: "DESTAQUE",
    description: "Vestido leve e feminino, perfeito para passeios e momentos especiais.",
    composition: "94% Viscose, 6% Elastano. Lavar à mão, não torcer. — EDITE com a composição real desta peça.",
    weightKg: 0.35, heightCm: 6, widthCm: 23, lengthCm: 32
  },
  {
    name: "Saia Jeans Básica",
    category: "Saias",
    price: 59.9,
    oldPrice: 69.9,
    sizes: ["10", "12", "14", "16"],
    colors: ["Jeans"],
    media: [
      { type: "image", src: "/assets/products/produto-03.svg" },
      { type: "image", src: "/assets/products/produto-03.svg" }
    ],
    reference: "FT-1003",
    featured: true,
    badge: "OFERTA",
    description: "Saia jeans versátil para combinar com diferentes estilos.",
    composition: "98% Algodão, 2% Elastano. Lavar à máquina em água fria. — EDITE com a composição real desta peça.",
    weightKg: 0.35, heightCm: 6, widthCm: 23, lengthCm: 28
  },
  {
    name: "Blusa Básica com Detalhe",
    category: "Blusas",
    price: 39.9,
    oldPrice: null,
    sizes: ["8", "10", "12", "14", "16"],
    colors: ["Off-white", "Rosa"],
    media: [
      { type: "image", src: "/assets/products/produto-04.svg" },
      { type: "image", src: "/assets/products/produto-04.svg" }
    ],
    reference: "FT-1004",
    featured: false,
    badge: null,
    description: "Blusa fácil de combinar, com caimento leve e visual delicado.",
    composition: "100% Algodão. Lavar à máquina, cores separadas. — EDITE com a composição real desta peça.",
    weightKg: 0.22, heightCm: 5, widthCm: 22, lengthCm: 28
  },
  {
    name: "Calça Wide Leg Teen",
    category: "Calças",
    price: 89.9,
    oldPrice: 99.9,
    sizes: ["10", "12", "14", "16"],
    colors: ["Jeans"],
    media: [
      { type: "image", src: "/assets/products/produto-05.svg" },
      { type: "image", src: "/assets/products/produto-05.svg" }
    ],
    reference: "FT-1005",
    featured: true,
    badge: "TREND",
    description: "Modelagem wide leg para um look atual e confortável.",
    composition: "97% Algodão, 3% Elastano. Não usar secadora. — EDITE com a composição real desta peça.",
    weightKg: 0.55, heightCm: 8, widthCm: 25, lengthCm: 34
  },
  {
    name: "Cropped Teen Básico",
    category: "Blusas",
    price: 34.9,
    oldPrice: null,
    sizes: ["10", "12", "14", "16"],
    colors: ["Preto", "Rosa", "Branco"],
    media: [
      { type: "image", src: "/assets/products/produto-06.svg" },
      { type: "image", src: "/assets/products/produto-06.svg" }
    ],
    reference: "FT-1006",
    featured: false,
    badge: null,
    description: "Peça curinga para criar diferentes combinações.",
    composition: "95% Algodão, 5% Elastano. Lavar à mão ou ciclo delicado. — EDITE com a composição real desta peça.",
    weightKg: 0.18, heightCm: 5, widthCm: 20, lengthCm: 25
  },
  {
    name: "Conjunto Moletom Trend",
    category: "Conjuntos",
    price: 99.9,
    oldPrice: null,
    sizes: ["10", "12", "14", "16"],
    colors: ["Lilás"],
    media: [
      { type: "image", src: "/assets/products/produto-07.svg" },
      { type: "image", src: "/assets/products/produto-07.svg" }
    ],
    reference: "FT-1007",
    featured: false,
    badge: "CONFORTO",
    description: "Conjunto confortável para dias mais frescos e looks casuais.",
    composition: "80% Algodão, 20% Poliéster. Lavar à máquina, não usar alvejante. — EDITE com a composição real desta peça.",
    weightKg: 0.7, heightCm: 10, widthCm: 27, lengthCm: 34
  },
  {
    name: "Shorts Jeans Mom",
    category: "Shorts",
    price: 54.9,
    oldPrice: 64.9,
    sizes: ["10", "12", "14", "16"],
    colors: ["Jeans"],
    media: [
      { type: "image", src: "/assets/products/produto-08.svg" },
      { type: "image", src: "/assets/products/produto-08.svg" }
    ],
    reference: "FT-1008",
    featured: false,
    badge: "OFERTA",
    description: "Shorts jeans de modelagem confortável para o dia a dia.",
    composition: "99% Algodão, 1% Elastano. Lavar à máquina em água fria. — EDITE com a composição real desta peça.",
    weightKg: 0.32, heightCm: 6, widthCm: 23, lengthCm: 28
  }
];

export default seed;
