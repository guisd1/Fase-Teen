import { boolean, integer, jsonb, numeric, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

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
  price: numeric("price", { precision: 10, scale: 2, mode: "number" }),
  oldPrice: numeric("old_price", { precision: 10, scale: 2, mode: "number" }),
  sizes: jsonb("sizes").$type<ProductSize[]>().notNull().default([]),
  colors: text("colors").array().notNull().default([]),
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
