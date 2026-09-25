import { hasDatabase } from "@/db/client";
import { getProduct } from "@/db/products";
import { createReview } from "@/db/reviews";
import { rateLimited } from "@/lib/redis";

export const dynamic = "force-dynamic";

const reply = (status: number, body: unknown) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

/** Só aceita fotos enviadas para a pasta de avaliações do nosso Blob. */
const isReviewImage = (url: unknown): url is string =>
  typeof url === "string" && /^https:\/\/[a-z0-9.-]+\.blob\.vercel-storage\.com\/avaliacoes\//i.test(url);

export async function POST(request: Request) {
  if (!hasDatabase()) return reply(503, { error: "Banco de dados não configurado." });
  if (await rateLimited(request, "reviews", 5, 60 * 60)) return reply(429, { error: "Muitas avaliações em pouco tempo. Tente mais tarde." });

  const body = await request.json().catch(() => null);
  const product = await getProduct(Number(body?.productId));
  if (!product) return reply(400, { error: "Produto não encontrado." });

  const name = String(body?.name ?? "").trim().slice(0, 60);
  const rating = Math.round(Number(body?.rating));
  const comment = String(body?.comment ?? "").trim().slice(0, 2000);
  const images = (Array.isArray(body?.images) ? body.images : []).filter(isReviewImage).slice(0, 3);
  if (!name) return reply(400, { error: "Informe seu nome." });
  if (!(rating >= 1 && rating <= 5)) return reply(400, { error: "Escolha uma nota de 1 a 5 estrelas." });

  await createReview({ productId: product.id, name, rating, comment, images });
  return reply(200, { ok: true });
}
