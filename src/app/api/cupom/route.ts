import { checkCoupon } from "@/db/coupons";
import { rateLimited } from "@/lib/redis";

export const dynamic = "force-dynamic";

const reply = (status: number, body: unknown) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

// Confere o cupom digitado no carrinho. O desconto é recalculado no servidor ao gravar o pedido.
export async function POST(request: Request) {
  // Dificulta ficar testando códigos no chute.
  if (await rateLimited(request, "coupon", 20, 10 * 60)) return reply(429, { error: "Muitas tentativas. Tente de novo em alguns minutos." });
  const body = await request.json().catch(() => null);
  const result = await checkCoupon(body?.code, Number(body?.subtotal) || 0);
  if ("error" in result) return reply(400, { error: result.error });
  const { code, type, value, minSubtotal } = result.coupon;
  return reply(200, { code, type, value, minSubtotal });
}
