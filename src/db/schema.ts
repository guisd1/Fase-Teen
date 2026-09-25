import { boolean, index, integer, jsonb, numeric, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import type { OrderStatus } from "@/lib/order-status";

export interface ProductImage {
  /** URL pública da foto (Vercel Blob). */
  src: string;
  /** Cor (variação) que a foto mostra. Vazio = vale para todas as cores. */
  color?: string | null;
}

export interface ProductSize {
  size: string;
  /** Quantidade em estoque deste tamanho. */
  stock: number;
}

/**
 * Tabela de medidas da peça: uma coluna por medida (Busto, Cintura...) e uma
 * linha por tamanho, com os valores na ordem das colunas.
 */
export interface SizeChart {
  columns: string[];
  rows: { size: string; values: string[] }[];
  /** Observação abaixo da tabela (ex.: "Medidas da peça em cm, deitada"). */
  note?: string;
}

/*
  Cada loja tem o próprio banco (DATABASE_URL diferente em cada projeto
  da Vercel), então não existe coluna de "loja" aqui.
  Só o nome é obrigatório: produto sem preço fica como rascunho e não
  aparece no site.
*/
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category"),
  /** Quanto a loja quer receber (o site soma as taxas do Mercado Pago). */
  price: numeric("price", { precision: 10, scale: 2, mode: "number" }),
  /** Custo da peça e mark-up (só no painel). Preenchidos, calculam o price. */
  costPrice: numeric("cost_price", { precision: 10, scale: 2, mode: "number" }),
  markupType: text("markup_type").$type<"percent" | "fixed">().notNull().default("percent"),
  markupValue: numeric("markup_value", { precision: 10, scale: 2, mode: "number" }),
  oldPrice: numeric("old_price", { precision: 10, scale: 2, mode: "number" }),
  sizes: jsonb("sizes").$type<ProductSize[]>().notNull().default([]),
  colors: text("colors").array().notNull().default([]),
  sizeChart: jsonb("size_chart").$type<SizeChart>(),
  /** Fotos do carrossel, na ordem de exibição. */
  images: jsonb("media").$type<ProductImage[]>().notNull().default([]),
  /** Vídeo do YouTube, sempre exibido por último no carrossel. */
  youtubeUrl: text("youtube_url"),
  /** Código/SKU. */
  reference: text("reference"),
  featured: boolean("featured").notNull().default(false),
  badge: text("badge"),
  description: text("description").notNull().default(""),
  composition: text("composition"),
  /** Peso (kg) e dimensões (cm) da embalagem, usados no cálculo de frete. */
  weightKg: numeric("weight_kg", { precision: 8, scale: 3, mode: "number" }),
  heightCm: numeric("height_cm", { precision: 8, scale: 2, mode: "number" }),
  widthCm: numeric("width_cm", { precision: 8, scale: 2, mode: "number" }),
  lengthCm: numeric("length_cm", { precision: 8, scale: 2, mode: "number" }),
  /** Produtos inativos não aparecem no site. */
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date())
});

export type ProductRow = typeof products.$inferSelect;
export type NewProductRow = typeof products.$inferInsert;

// ---- Pedidos ----

export type { OrderStatus };

export interface OrderItem {
  productId: number;
  name: string;
  reference: string | null;
  size: string;
  color: string;
  qty: number;
  /** Preço unitário no momento do pedido. */
  price: number;
}

export interface OrderAddress {
  cep: string;
  address: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
}

export type PaymentMethod = "whatsapp" | "pix" | "card";

export interface OrderPaymentData {
  /** Pix: código "copia e cola". */
  pixCode?: string;
  /** Pix: imagem do QR Code em base64 (PNG). */
  pixQrBase64?: string;
  /** Pix: quando o código deixa de valer (ISO). */
  pixExpiresAt?: string;
  /** Cartão: link do checkout do Mercado Pago. */
  checkoutUrl?: string;
}

export interface OrderShipping {
  company: string;
  service: string;
  deliveryTime: number | null;
}

/*
  O pedido é gravado quando o cliente clica em "Enviar pedido pelo WhatsApp".
  Começa como "pendente" (aguardando a conversa no WhatsApp) e o estoque só
  é baixado quando o administrador confirma (passa para "preparacao").
*/
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  /** Número que o cliente vê (6 dígitos aleatórios), para não revelar quantos pedidos a loja já teve. */
  code: text("code").notNull().unique(),
  status: text("status").$type<OrderStatus>().notNull().default("pendente"),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerEmail: text("customer_email"),
  deliveryMode: text("delivery_mode").$type<"delivery" | "pickup">().notNull(),
  address: jsonb("address").$type<OrderAddress>(),
  shipping: jsonb("shipping").$type<OrderShipping>(),
  items: jsonb("items").$type<OrderItem[]>().notNull(),
  subtotal: numeric("subtotal", { precision: 10, scale: 2, mode: "number" }).notNull(),
  freight: numeric("freight", { precision: 10, scale: 2, mode: "number" }).notNull().default(0),
  discount: numeric("discount", { precision: 10, scale: 2, mode: "number" }).notNull().default(0),
  couponCode: text("coupon_code"),
  total: numeric("total", { precision: 10, scale: 2, mode: "number" }).notNull(),
  /** Observações do cliente. */
  notes: text("notes"),
  /** Anotações internas do administrador (não aparecem para o cliente). */
  adminNotes: text("admin_notes"),
  trackingCode: text("tracking_code"),
  /** Como o cliente escolheu pagar. */
  paymentMethod: text("payment_method").$type<PaymentMethod>().notNull().default("whatsapp"),
  /** Desconto do Pix (além do cupom), já abatido do total. */
  paymentDiscount: numeric("payment_discount", { precision: 10, scale: 2, mode: "number" }).notNull().default(0),
  /** Status no Mercado Pago: pending, approved, rejected, cancelled, refunded... */
  paymentStatus: text("payment_status"),
  /** Id do pagamento no Mercado Pago. */
  paymentId: text("payment_id"),
  /** Dados para mostrar de novo o Pix (QR Code) ou reabrir o checkout do cartão. */
  paymentData: jsonb("payment_data").$type<OrderPaymentData>(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  /**
   * Chave secreta do link de acompanhamento do pedido (/pedido/<token>).
   * O número do pedido é curto e dá para chutar; o token não.
   */
  publicToken: text("public_token").notNull().unique().default(sql`md5(random()::text || clock_timestamp()::text)`),
  /** Verdadeiro enquanto o estoque deste pedido estiver descontado dos produtos. */
  stockApplied: boolean("stock_applied").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date())
});

export type OrderRow = typeof orders.$inferSelect;
export type NewOrderRow = typeof orders.$inferInsert;

// ---- Avaliações ----

/*
  Qualquer visitante pode avaliar, então toda avaliação entra como não
  aprovada e só aparece no site depois que o administrador aprova no painel.
*/
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  /** Nota de 1 a 5. */
  rating: integer("rating").notNull(),
  comment: text("comment").notNull().default(""),
  /** Fotos enviadas pelo cliente (Vercel Blob). */
  images: text("images").array().notNull().default([]),
  approved: boolean("approved").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, t => [index("reviews_product_idx").on(t.productId, t.approved)]);

export type ReviewRow = typeof reviews.$inferSelect;

// ---- Cupons ----

export const coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  /** Sempre em maiúsculas. */
  code: text("code").notNull().unique(),
  /** "percent": value é a porcentagem; "fixed": value é em reais. */
  type: text("type").$type<"percent" | "fixed">().notNull(),
  value: numeric("value", { precision: 10, scale: 2, mode: "number" }).notNull(),
  /** Valor mínimo em produtos para o cupom valer. */
  minSubtotal: numeric("min_subtotal", { precision: 10, scale: 2, mode: "number" }),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  /** Limite de pedidos com o cupom. Vazio = sem limite. */
  maxUses: integer("max_uses"),
  uses: integer("uses").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

export type CouponRow = typeof coupons.$inferSelect;
export type NewCouponRow = typeof coupons.$inferInsert;

// ---- Configurações da loja editáveis no painel ----

/** Uma linha por configuração (ex.: "payment-fees"). */
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date())
});
