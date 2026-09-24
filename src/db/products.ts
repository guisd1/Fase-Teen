import { and, asc, eq, inArray } from "drizzle-orm";
import { getStore } from "@/stores";
import { getDb, hasDatabase } from "./client";
import { products, type NewProductRow, type ProductMedia, type ProductRow } from "./schema";
import { getSeed } from "./seed";

/** Dados do produto que vão para o navegador (sem peso/dimensões). */
export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  oldPrice: number | null;
  sizes: string[];
  colors: string[];
  media: ProductMedia[];
  reference: string | null;
  featured: boolean;
  badge: string | null;
  description: string;
  composition: string | null;
}

export interface ProductShipping {
  id: number;
  name: string;
  price: number;
  weightKg: number;
  heightCm: number;
  widthCm: number;
  lengthCm: number;
}

/*
  Sem DATABASE_URL (ex.: rodando localmente sem banco), o site usa os
  produtos de src/db/seed para facilitar o desenvolvimento. Em produção
  na Vercel o banco é obrigatório.
*/
function useSeedFallback() {
  if (hasDatabase()) return false;
  if (process.env.VERCEL_ENV === "production") {
    throw new Error("DATABASE_URL não configurado. Conecte um banco Neon ao projeto na Vercel.");
  }
  return true;
}

function seedRows(): ProductRow[] {
  const now = new Date();
  return getSeed(getStore().id).map((p, index) => ({
    oldPrice: null, sizes: [], colors: [], media: [], reference: null, featured: false, badge: null,
    description: "", composition: null, active: true, sortOrder: 0,
    ...p,
    id: index + 1,
    createdAt: now,
    updatedAt: now
  }) as ProductRow);
}

function toPublic(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    price: row.price,
    oldPrice: row.oldPrice,
    sizes: row.sizes,
    colors: row.colors,
    media: row.media,
    reference: row.reference,
    featured: row.featured,
    badge: row.badge,
    description: row.description,
    composition: row.composition
  };
}

export async function getProducts(): Promise<Product[]> {
  if (useSeedFallback()) return seedRows().map(toPublic);
  const rows = await getDb()
    .select()
    .from(products)
    .where(eq(products.active, true))
    .orderBy(asc(products.sortOrder), asc(products.id));
  return rows.map(toPublic);
}

export async function getShippingInfo(ids: number[]): Promise<ProductShipping[]> {
  if (!ids.length) return [];
  const rows = useSeedFallback()
    ? seedRows().filter(p => ids.includes(p.id))
    : await getDb().select().from(products).where(and(inArray(products.id, ids), eq(products.active, true)));
  return rows.map(r => ({
    id: r.id, name: r.name, price: r.price,
    weightKg: r.weightKg, heightCm: r.heightCm, widthCm: r.widthCm, lengthCm: r.lengthCm
  }));
}

export async function insertProducts(rows: NewProductRow[]) {
  if (!rows.length) return 0;
  const inserted = await getDb().insert(products).values(rows).returning({ id: products.id });
  return inserted.length;
}

export async function countProducts() {
  const rows = await getDb().select({ id: products.id }).from(products);
  return rows.length;
}
