import { getShippingInfo } from "@/db/products";
import { createOrder } from "@/db/orders";
import type { OrderAddress, OrderItem, OrderShipping } from "@/db/schema";
import { hasDatabase } from "@/db/client";
import { cleanCep } from "@/lib/format";
import { rateLimited } from "@/lib/redis";
import { checkCoupon, redeemCoupon } from "@/db/coupons";
import { couponDiscount } from "@/lib/coupon";

export const dynamic = "force-dynamic";

const reply = (status: number, body: unknown) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

const str = (v: unknown, max = 200) => String(v ?? "").trim().slice(0, max);
const round = (n: number) => Math.round(n * 100) / 100;

/*
  Grava o pedido feito pelo checkout (antes de abrir o WhatsApp).
  Nome, preço e referência dos produtos vêm do banco, nunca do navegador.
  O frete é o valor que o cliente escolheu no carrinho e fica só como registro.
*/
export async function POST(request: Request) {
  if (!hasDatabase()) return reply(503, { error: "Banco de dados não configurado." });
  // Até 30 pedidos por hora por IP, para ninguém encher a lista de pedidos falsos.
  // Não dá para ser muito menos: na internet do celular vários clientes saem pelo mesmo IP da operadora.
  if (await rateLimited(request, "orders", 30, 60 * 60)) return reply(429, { error: "Muitos pedidos em pouco tempo. Tente novamente mais tarde." });

  const body = await request.json().catch(() => null);
  const customerName = str(body?.customer?.name, 120);
  const customerPhone = str(body?.customer?.phone, 40);
  const customerEmail = str(body?.customer?.email, 160) || null;
  if (!customerName || !customerPhone) return reply(400, { error: "Nome e WhatsApp são obrigatórios." });

  const rawItems: unknown[] = Array.isArray(body?.items) ? body.items.slice(0, 50) : [];
  if (!rawItems.length) return reply(400, { error: "Carrinho vazio." });

  const catalog = await getShippingInfo([...new Set(rawItems.map(i => Number((i as { id?: unknown })?.id)).filter(Number.isInteger))]);
  const items: OrderItem[] = [];
  for (const raw of rawItems as { id?: unknown; size?: unknown; color?: unknown; qty?: unknown }[]) {
    const product = catalog.find(p => p.id === Number(raw?.id));
    if (!product) return reply(400, { error: "Um dos produtos do carrinho não está mais disponível. Atualize a página." });
    items.push({
      productId: product.id,
      name: product.name,
      reference: product.reference,
      size: str(raw.size, 30),
      color: str(raw.color, 60),
      qty: Math.max(1, Math.min(50, Math.floor(Number(raw.qty) || 1))),
      price: product.price
    });
  }

  const pickup = body?.deliveryMode === "pickup";
  let address: OrderAddress | null = null;
  let shipping: OrderShipping | null = null;
  let freight = 0;
  if (!pickup) {
    const a = body?.address ?? {};
    address = {
      cep: cleanCep(a.cep), address: str(a.address), number: str(a.number, 30), complement: str(a.complement, 120),
      district: str(a.district, 120), city: str(a.city, 120), state: str(a.state, 2).toUpperCase()
    };
    if (address.cep.length !== 8 || !address.address || !address.city) return reply(400, { error: "Endereço incompleto." });
    const s = body?.shipping ?? {};
    const price = Number(s.price);
    freight = Number.isFinite(price) && price >= 0 && price < 10000 ? Math.round(price * 100) / 100 : 0;
    const days = Number(s.deliveryTime);
    shipping = { company: str(s.company, 80), service: str(s.service, 80), deliveryTime: Number.isFinite(days) && days > 0 ? days : null };
  }

  const subtotal = round(items.reduce((sum, i) => sum + i.price * i.qty, 0));

  // Cupom: conferido de novo aqui (pode ter expirado desde que foi aplicado no carrinho).
  let discount = 0;
  let couponCode: string | null = null;
  let couponError: string | null = null;
  if (body?.couponCode) {
    const result = await checkCoupon(body.couponCode, subtotal);
    if ("error" in result) couponError = result.error;
    else if (!(await redeemCoupon(result.coupon.id))) couponError = "Este cupom já atingiu o limite de usos.";
    else {
      discount = couponDiscount(result.coupon, subtotal);
      couponCode = result.coupon.code;
    }
  }

  const total = round(subtotal - discount + freight);
  try {
    const order = await createOrder({
      customerName, customerPhone, customerEmail,
      deliveryMode: pickup ? "pickup" : "delivery",
      address, shipping, items,
      subtotal, freight, discount, couponCode, total,
      notes: str(body?.notes, 1000) || null
    });
    return reply(200, { code: order.code, subtotal, discount, couponCode, couponError, total });
  } catch (error) {
    console.error("Falha ao gravar pedido:", error);
    return reply(500, { error: "Não foi possível registrar o pedido." });
  }
}
