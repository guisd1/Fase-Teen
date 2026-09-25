import { and, asc, avg, count, desc, eq } from "drizzle-orm";
import { getDb, hasDatabase } from "./client";
import { products, reviews, type ReviewRow } from "./schema";

/** Avaliação que vai para o navegador. */
export interface Review {
  id: number;
  name: string;
  rating: number;
  comment: string;
  images: string[];
  createdAt: string;
}

export interface ReviewSummary {
  average: number;
  total: number;
}

export async function getProductReviews(productId: number): Promise<{ reviews: Review[]; summary: ReviewSummary }> {
  if (!hasDatabase()) return { reviews: [], summary: { average: 0, total: 0 } };
  const rows = await getDb().select().from(reviews)
    .where(and(eq(reviews.productId, productId), eq(reviews.approved, true)))
    .orderBy(desc(reviews.createdAt));
  const total = rows.length;
  const average = total ? rows.reduce((s, r) => s + r.rating, 0) / total : 0;
  return {
    reviews: rows.map(r => ({ id: r.id, name: r.name, rating: r.rating, comment: r.comment, images: r.images, createdAt: r.createdAt.toISOString() })),
    summary: { average, total }
  };
}

/** Média e total de avaliações aprovadas de cada produto (para os cards do catálogo). */
export async function getReviewSummaries(): Promise<Map<number, ReviewSummary>> {
  if (!hasDatabase()) return new Map();
  const rows = await getDb()
    .select({ productId: reviews.productId, average: avg(reviews.rating).mapWith(Number), total: count() })
    .from(reviews).where(eq(reviews.approved, true)).groupBy(reviews.productId);
  return new Map(rows.map(r => [r.productId, { average: r.average, total: r.total }]));
}

export async function createReview(data: { productId: number; name: string; rating: number; comment: string; images: string[] }) {
  await getDb().insert(reviews).values(data);
}

// ---- Painel ----

export type AdminReview = ReviewRow & { productName: string };

export async function adminListReviews(): Promise<AdminReview[]> {
  if (!hasDatabase()) return [];
  const rows = await getDb()
    .select({ review: reviews, productName: products.name })
    .from(reviews).innerJoin(products, eq(products.id, reviews.productId))
    // Pendentes primeiro, depois as mais recentes.
    .orderBy(asc(reviews.approved), desc(reviews.createdAt));
  return rows.map(r => ({ ...r.review, productName: r.productName }));
}

export async function adminCountPendingReviews() {
  if (!hasDatabase()) return 0;
  return getDb().$count(reviews, eq(reviews.approved, false));
}

export async function adminSetReviewApproved(id: number, approved: boolean) {
  const [row] = await getDb().update(reviews).set({ approved }).where(eq(reviews.id, id)).returning({ productId: reviews.productId });
  return row?.productId ?? null;
}

export async function adminDeleteReview(id: number) {
  const [row] = await getDb().delete(reviews).where(eq(reviews.id, id)).returning();
  return row ?? null;
}

/** Fotos das avaliações de um produto (para apagar do Blob junto com o produto). */
export async function reviewImagesOf(productId: number) {
  const rows = await getDb().select({ images: reviews.images }).from(reviews).where(eq(reviews.productId, productId));
  return rows.flatMap(r => r.images);
}
