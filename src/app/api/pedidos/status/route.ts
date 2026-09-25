import { revalidatePath } from "next/cache";
import { applyPayment, getOrderByToken } from "@/db/orders";
import type { OrderRow } from "@/db/schema";
import { findPayments, getPayment, mercadoPagoConfigured } from "@/lib/mercado-pago";

export const dynamic = "force-dynamic";

const reply = (status: number, body: unknown) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

/**
 * Confere o pagamento direto no Mercado Pago, sem esperar a notificação
 * (que às vezes demora). Pix: pelo id do pagamento; cartão: pela busca por pedido.
 */
async function refresh(order: OrderRow) {
  if (order.paidAt || order.paymentMethod === "whatsapp" || !mercadoPagoConfigured()) return false;
  if (order.paymentMethod === "pix" && order.paymentId) return applyPayment(order, await getPayment(order.paymentId));
  const payments = await findPayments(order.code);
  const best = payments.find(p => p.status === "approved") ?? payments[0];
  return best ? applyPayment(order, best) : false;
}

/** Status público do pedido (só com o token secreto do link de acompanhamento). */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  let order = await getOrderByToken(token);
  if (!order) return reply(404, { error: "Pedido não encontrado." });
  try {
    if (await refresh(order)) {
      revalidatePath("/", "layout");
      order = (await getOrderByToken(token))!;
    }
  } catch (error) {
    console.error("Falha ao consultar pagamento:", error);
  }
  return reply(200, {
    code: order.code,
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    paid: Boolean(order.paidAt),
    total: order.total
  });
}
