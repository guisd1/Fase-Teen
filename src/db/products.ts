import { cache } from "react";
import { and, asc, desc, eq, inArray, isNotNull } from "drizzle-orm";
import { getDb, hasDatabase } from "./client";
import { products, type NewProductRow, type ProductImage, type ProductRow, type ProductSize, type SizeChart } from "./schema";
import { getPaymentFees } from "./settings";
import { cardPrice, pixPrice, type PaymentFees } from "@/lib/pricing";

/** Dados do produto que vão para o navegador (sem peso/dimensões). */
export interface Product {
  id: number;
  slug: string;
  name: string;
  category: string;
  /** Preço no site (cartão), já com a taxa do Mercado Pago. */
  price: number;
  /** Preço no Pix (menor, com a taxa do Pix). Igual a price sem Mercado Pago. */
  pixPrice: number;
  oldPrice: number | null;
  /** Promoção com data ativa agora: % de desconto e quando termina. */
  promo: { percent: number; endsAt: string | null } | null;
  sizes: ProductSize[];
  /** Tabela de medidas (null = sem tabela). */
  sizeChart: SizeChart | null;
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
  reference: string | null;
  /** Valor que a loja quer receber (cadastrado no painel). */
  price: number;
  /** Preço cobrado no cartão / WhatsApp e no Pix, com as taxas. */
  cardPrice: number;
  pixPrice: number;
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

/** Promoção com data valendo agora? */
function activePromo(row: Pick<ProductRow, "promoPercent" | "promoStartsAt" | "promoEndsAt">, now = new Date()) {
  const p = row.promoPercent;
  if (!p || p <= 0 || p >= 100) return null;
  if (row.promoStartsAt && now < row.promoStartsAt) return null;
  if (row.promoEndsAt && now > row.promoEndsAt) return null;
  return { percent: p, endsAt: row.promoEndsAt?.toISOString() ?? null };
}

/** Valor a receber já com a promoção com data, se estiver valendo. */
export function effectiveNet(row: Pick<ProductRow, "price" | "promoPercent" | "promoStartsAt" | "promoEndsAt">) {
  const net = row.price ?? 0;
  const promo = activePromo(row);
  return promo ? Math.round(net * (1 - promo.percent / 100) * 100) / 100 : net;
}

function toPublic(row: ProductRow, fees: PaymentFees): Product {
  const promo = activePromo(row);
  const net = effectiveNet(row);
  // Na promoção, o preço "de" é o preço normal (ou o preço antigo cadastrado, se for maior).
  const regular = Math.max(row.price ?? 0, row.oldPrice ?? 0);
  return {
    id: row.id,
    slug: productSlug(row),
    name: row.name,
    category: row.category ?? "",
    price: cardPrice(net, fees),
    pixPrice: pixPrice(net, fees),
    oldPrice: promo ? cardPrice(regular, fees) : row.oldPrice === null ? null : cardPrice(row.oldPrice, fees),
    promo,
    sizes: row.sizes,
    sizeChart: row.sizeChart,
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
  const [rows, fees] = await Promise.all([
    getDb().select().from(products).where(visible).orderBy(asc(products.sortOrder), desc(products.id)),
    getPaymentFees()
  ]);
  return rows.map(r => toPublic(r, fees));
});

export async function getProduct(id: number): Promise<Product | null> {
  if (!Number.isInteger(id)) return null;
  return (await getProducts()).find(p => p.id === id) ?? null;
}

export async function getShippingInfo(ids: number[]): Promise<ProductShipping[]> {
  if (!ids.length || noDatabase()) return [];
  const [rows, fees] = await Promise.all([
    getDb().select().from(products).where(and(inArray(products.id, ids), visible)),
    getPaymentFees()
  ]);
  return rows.map(r => ({
    id: r.id, name: r.name, reference: r.reference, price: effectiveNet(r),
    cardPrice: cardPrice(effectiveNet(r), fees), pixPrice: pixPrice(effectiveNet(r), fees),
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

/** URLs de todas as fotos em uso nos produtos (para não apagar do Blob foto usada por uma cópia). */
export async function allProductImageUrls(): Promise<Set<string>> {
  if (noDatabase()) return new Set();
  const rows = await getDb().select({ images: products.images }).from(products);
  return new Set(rows.flatMap(r => r.images.map(i => i.src)));
}

/** Cria uma cópia do produto (inativa, com as mesmas fotos) e devolve o id novo. */
export async function adminDuplicateProduct(id: number): Promise<number | null> {
  const original = await adminGetProduct(id);
  if (!original) return null;
  const { id: _id, createdAt: _c, updatedAt: _u, ...data } = original;
  return adminCreateProduct({ ...data, name: `${original.name} (cópia)`, active: false, featured: false });
}

/** Grava a ordem da vitrine: o primeiro id aparece primeiro no site. */
export async function adminSetProductOrder(ids: number[]) {
  const db = getDb();
  await Promise.all(ids.map((id, index) => db.update(products).set({ sortOrder: index }).where(eq(products.id, id))));
}

/** Atualiza só o estoque dos tamanhos de vários produtos. */
export async function adminSetStock(changes: { id: number; sizes: ProductSize[] }[]) {
  const db = getDb();
  await Promise.all(changes.map(c => db.update(products).set({ sizes: c.sizes }).where(eq(products.id, c.id))));
}
