import { revalidatePath } from "next/cache";
import { applyPayment, getOrderByCode } from "@/db/orders";
import { getPayment, mercadoPagoConfigured, validWebhookSignature } from "@/lib/mercado-pago";

export const dynamic = "force-dynamic";

/*
  Notificações do Mercado Pago (pagamento criado, aprovado, recusado...).
  A notificação só diz "o pagamento X mudou": o status é sempre lido de novo
  na API do Mercado Pago, então uma notificação falsa não aprova nada.
*/
export async function POST(request: Request) {
  if (!mercadoPagoConfigured()) return new Response(null, { status: 204 });
  const url = new URL(request.url);
  const body = await request.json().catch(() => ({}));
  const type = url.searchParams.get("type") ?? url.searchParams.get("topic") ?? body?.type ?? body?.topic;
  const id = String(url.searchParams.get("data.id") ?? body?.data?.id ?? url.searchParams.get("id") ?? "");
  if (type !== "payment" || !/^\d+$/.test(id)) return new Response(null, { status: 200 });
  if (!validWebhookSignature(request, id)) return new Response("assinatura inválida", { status: 401 });

  try {
    const payment = await getPayment(id);
    const order = payment.externalReference ? await getOrderByCode(payment.externalReference) : null;
    if (order && (await applyPayment(order, payment))) revalidatePath("/", "layout");
  } catch (error) {
    // 500 faz o Mercado Pago tentar de novo mais tarde.
    console.error("Falha ao processar notificação do Mercado Pago:", error);
    return new Response(null, { status: 500 });
  }
  return new Response(null, { status: 200 });
}
