import { cache } from "react";
import { and, asc, desc, eq, inArray, isNotNull } from "drizzle-orm";
import { getDb, hasDatabase } from "./client";
import { products, type NewProductRow, type ProductImage, type ProductRow, type ProductSize } from "./schema";

/** Dados do produto que vão para o navegador (sem peso/dimensões). */
export interface Product {
  id: number;
  slug: string;
  name: string;
  category: string;
  price: number;
  oldPrice: number | null;
  sizes: ProductSize[];
  colors: string[];
  images: ProductImage[];
  youtubeUrl: string | null;
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
  weightKg: number | null;
  heightCm: number | null;
  widthCm: number | null;
  lengthCm: number | null;
}

export function slugify(text: string) {
  return text
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** URL da página do produto: /produto/12-vestido-floral */
export const productSlug = (p: { id: number; name: string }) => `${p.id}-${slugify(p.name)}`;

/*
  Sem DATABASE_URL (ex.: rodando localmente sem banco), o site abre com o
  catálogo vazio. Em produção na Vercel o banco é obrigatório.
*/
function noDatabase() {
  if (hasDatabase()) return false;
  if (process.env.VERCEL_ENV === "production") {
    throw new Error("DATABASE_URL não configurado. Conecte um banco Neon ao projeto na Vercel.");
  }
  return true;
}

function toPublic(row: ProductRow): Product {
  return {
    id: row.id,
    slug: productSlug(row),
    name: row.name,
    category: row.category ?? "",
    price: row.price ?? 0,
    oldPrice: row.oldPrice,
    sizes: row.sizes,
    colors: row.colors,
    images: row.images,
    youtubeUrl: row.youtubeUrl,
    reference: row.reference,
    featured: row.featured,
    badge: row.badge,
    description: row.description,
    composition: row.composition
  };
}

/** Produtos visíveis no site: ativos e com preço. */
const visible = and(eq(products.active, true), isNotNull(products.price));

// cache(): layout e página da mesma requisição compartilham uma única consulta.
export const getProducts = cache(async (): Promise<Product[]> => {
  if (noDatabase()) return [];
  const rows = await getDb().select().from(products).where(visible)
    .orderBy(asc(products.sortOrder), desc(products.id));
  return rows.map(toPublic);
});

export async function getProduct(id: number): Promise<Product | null> {
  if (!Number.isInteger(id)) return null;
  return (await getProducts()).find(p => p.id === id) ?? null;
}

export async function getShippingInfo(ids: number[]): Promise<ProductShipping[]> {
  if (!ids.length || noDatabase()) return [];
  const rows = await getDb().select().from(products).where(and(inArray(products.id, ids), visible));
  return rows.map(r => ({
    id: r.id, name: r.name, price: r.price ?? 0,
    weightKg: r.weightKg, heightCm: r.heightCm, widthCm: r.widthCm, lengthCm: r.lengthCm
  }));
}

// ---- Painel de administrador ----

export async function adminListProducts(): Promise<ProductRow[]> {
  if (noDatabase()) return [];
  return getDb().select().from(products).orderBy(asc(products.sortOrder), desc(products.id));
}

export async function adminGetProduct(id: number): Promise<ProductRow | null> {
  if (noDatabase()) return null;
  const [row] = await getDb().select().from(products).where(eq(products.id, id));
  return row ?? null;
}

export async function adminCategories(): Promise<string[]> {
  if (noDatabase()) return [];
  const rows = await getDb().selectDistinct({ category: products.category }).from(products)
    .where(isNotNull(products.category)).orderBy(asc(products.category));
  return rows.map(r => r.category!).filter(Boolean);
}

export async function adminCreateProduct(data: NewProductRow) {
  const [row] = await getDb().insert(products).values(data).returning({ id: products.id });
  return row.id;
}

export async function adminUpdateProduct(id: number, data: Partial<NewProductRow>) {
  await getDb().update(products).set(data).where(eq(products.id, id));
}

export async function adminDeleteProduct(id: number) {
  const [row] = await getDb().delete(products).where(eq(products.id, id)).returning();
  return row ?? null;
}
