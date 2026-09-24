import { boolean, integer, jsonb, numeric, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export type ProductMedia =
  | { type: "image"; src: string }
  | { type: "video"; src: string };

/*
  Cada loja tem o próprio banco (DATABASE_URL diferente em cada projeto
  da Vercel), então não existe coluna de "loja" aqui.
*/
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  price: numeric("price", { precision: 10, scale: 2, mode: "number" }).notNull(),
  oldPrice: numeric("old_price", { precision: 10, scale: 2, mode: "number" }),
  sizes: text("sizes").array().notNull().default([]),
  colors: text("colors").array().notNull().default([]),
  /** Carrossel do produto, na ordem de exibição. */
  media: jsonb("media").$type<ProductMedia[]>().notNull().default([]),
  /** Código/SKU. */
  reference: text("reference"),
  featured: boolean("featured").notNull().default(false),
  badge: text("badge"),
  description: text("description").notNull().default(""),
  composition: text("composition"),
  /** Peso (kg) e dimensões (cm) da embalagem, usados no cálculo de frete. */
  weightKg: numeric("weight_kg", { precision: 8, scale: 3, mode: "number" }).notNull(),
  heightCm: numeric("height_cm", { precision: 8, scale: 2, mode: "number" }).notNull(),
  widthCm: numeric("width_cm", { precision: 8, scale: 2, mode: "number" }).notNull(),
  lengthCm: numeric("length_cm", { precision: 8, scale: 2, mode: "number" }).notNull(),
  /** Produtos inativos não aparecem no site. */
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date())
});

export type ProductRow = typeof products.$inferSelect;
export type NewProductRow = typeof products.$inferInsert;
