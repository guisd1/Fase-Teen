import { getProduct } from "@/db/products";
import { addToWaitlist } from "@/db/recovery";
import { rateLimited } from "@/lib/redis";

export const dynamic = "force-dynamic";

const reply = (status: number, body: unknown) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

/** "Avise-me quando chegar": nome e WhatsApp de quem quer um tamanho esgotado. */
export async function POST(request: Request) {
  if (await rateLimited(request, "avise-me", 10, 60 * 60)) return reply(429, { error: "Muitos pedidos de aviso. Tente mais tarde." });
  const body = await request.json().catch(() => ({}));
  const name = String(body?.name ?? "").trim().slice(0, 80);
  const phone = String(body?.phone ?? "").trim().slice(0, 40);
  const size = String(body?.size ?? "").trim().slice(0, 20);
  if (!name || phone.replace(/\D/g, "").length < 10) return reply(400, { error: "Informe seu nome e um WhatsApp com DDD." });
  const product = await getProduct(Number(body?.productId));
  if (!product) return reply(404, { error: "Produto não encontrado." });
  if (size && !product.sizes.some(s => s.size === size)) return reply(400, { error: "Tamanho inválido." });
  await addToWaitlist({ productId: product.id, size, name, phone });
  return reply(200, { ok: true });
}
