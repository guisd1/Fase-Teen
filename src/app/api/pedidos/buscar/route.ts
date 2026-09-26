import { getOrderByCode } from "@/db/orders";
import { rateLimited } from "@/lib/redis";

export const dynamic = "force-dynamic";

const digits = (v: string) => v.replace(/\D/g, "");

/**
 * "Acompanhar pedido": número do pedido + e-mail ou telefone usado na compra.
 * Devolve o link da página do pedido. Limitado por IP contra tentativas em massa.
 */
export async function POST(request: Request) {
  if (await rateLimited(request, "buscar-pedido", 20, 60 * 60)) {
    return Response.json({ error: "Muitas tentativas. Aguarde um pouco e tente de novo." }, { status: 429 });
  }
  const body = await request.json().catch(() => ({}));
  const code = digits(String(body.code ?? ""));
  const contact = String(body.contact ?? "").trim().toLowerCase();
  if (!/^\d{6}$/.test(code) || !contact) {
    return Response.json({ error: "Informe o número do pedido (6 dígitos) e o e-mail ou telefone da compra." }, { status: 400 });
  }

  const order = await getOrderByCode(code);
  const byEmail = contact.includes("@") && order?.customerEmail?.trim().toLowerCase() === contact;
  // Telefone: compara os últimos 8 dígitos (aceita com ou sem DDD/DDI, traços e espaços).
  const phone = digits(contact);
  const byPhone = phone.length >= 8 && !!order && digits(order.customerPhone).endsWith(phone.slice(-8));
  if (!order || !(byEmail || byPhone)) {
    return Response.json({ error: "Não encontramos um pedido com esses dados. Confira o número e o contato usados na compra." }, { status: 404 });
  }
  return Response.json({ url: `/pedido/${order.publicToken}` });
}
