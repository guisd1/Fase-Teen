import { getShippingInfo } from "@/db/products";
import { createOrder, discardOrder, setOrderPayment } from "@/db/orders";
import type { OrderAddress, OrderItem, OrderShipping, PaymentMethod } from "@/db/schema";
import { hasDatabase } from "@/db/client";
import { cleanCep } from "@/lib/format";
import { rateLimited } from "@/lib/redis";
import { checkCoupon, redeemCoupon, releaseCoupon } from "@/db/coupons";
import { couponDiscount } from "@/lib/coupon";
import { QuoteError, quoteShipping } from "@/lib/shipping-quote";
import { createCardCheckout, createPixPayment, mercadoPagoConfigured, saveLastError } from "@/lib/mercado-pago";
import { getStore } from "@/stores";
import { cleanSource } from "@/lib/traffic-source";
import { getPromotions } from "@/db/settings";
import { hasFreeShipping } from "@/lib/promotions";
import { markCartRecovered } from "@/db/recovery";

export const dynamic = "force-dynamic";

const reply = (status: number, body: unknown) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

const str = (v: unknown, max = 200) => String(v ?? "").trim().slice(0, max);
const round = (n: number) => Math.round(n * 100) / 100;

/*
  Grava o pedido feito pelo checkout.
  - WhatsApp: o pedido fica registrado e o cliente combina o pagamento pela conversa.
    O frete é o que o cliente escolheu no carrinho e fica só como registro.
  - Pix / cartão (Mercado Pago): o frete é cotado de novo aqui e o pagamento é criado
    com o total calculado no servidor.
  Nome, preço e referência dos produtos vêm sempre do banco, nunca do navegador.
*/
export async function POST(request: Request) {
  if (!hasDatabase()) return reply(503, { error: "Banco de dados não configurado." });
  // Até 30 pedidos por hora por IP, para ninguém encher a lista de pedidos falsos.
  // Não dá para ser muito menos: na internet do celular vários clientes saem pelo mesmo IP da operadora.
  if (await rateLimited(request, "orders", 30, 60 * 60)) return reply(429, { error: "Muitos pedidos em pouco tempo. Tente novamente mais tarde." });

  const store = getStore();
  const body = await request.json().catch(() => null);
  const requested = body?.paymentMethod;
  const paymentMethod: PaymentMethod = (requested === "pix" || requested === "card") && mercadoPagoConfigured() ? requested : "whatsapp";
  const online = paymentMethod !== "whatsapp";

  const customerName = str(body?.customer?.name, 120);
  const customerPhone = str(body?.customer?.phone, 40);
  const customerEmail = str(body?.customer?.email, 160) || null;
  if (!customerName || !customerPhone) return reply(400, { error: "Nome e WhatsApp são obrigatórios." });
  if (online && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail ?? "")) return reply(400, { error: "Informe um e-mail válido para pagar online." });

  const rawItems: unknown[] = Array.isArray(body?.items) ? body.items.slice(0, 50) : [];
  if (!rawItems.length) return reply(400, { error: "Carrinho vazio." });

  const catalog = await getShippingInfo([...new Set(rawItems.map(i => Number((i as { id?: unknown })?.id)).filter(Number.isInteger))]);
  const items: OrderItem[] = [];
  // Preço do Pix de cada item (o pedido guarda o preço cheio, do cartão).
  const pixPrices: number[] = [];
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
      price: product.cardPrice
    });
    pixPrices.push(product.pixPrice);
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
    if (online) {
      // Cobra o frete cotado agora, não o valor que veio do navegador.
      let option;
      try {
        const quote = await quoteShipping(address.cep, items.map(i => ({ id: i.productId, quantity: i.qty })));
        option = quote.options.find(o => o.id === String(s.id));
      } catch (error) {
        const message = error instanceof QuoteError ? error.message : "Não foi possível conferir o frete agora.";
        return reply(502, { error: `${message} Tente de novo em instantes.` });
      }
      if (!option) return reply(409, { error: "A opção de frete mudou. Calcule o frete de novo no carrinho.", shippingChanged: true });
      freight = round(option.price);
      shipping = { company: option.company, service: option.service, deliveryTime: option.deliveryTime, price: round(option.price) };
    } else {
      const price = Number(s.price);
      freight = Number.isFinite(price) && price >= 0 && price < 10000 ? round(price) : 0;
      const days = Number(s.deliveryTime);
      shipping = { company: str(s.company, 80), service: str(s.service, 80), deliveryTime: Number.isFinite(days) && days > 0 ? days : null, price: freight };
    }
  }

  const subtotal = round(items.reduce((sum, i) => sum + i.price * i.qty, 0));
  // Frete grátis a partir do valor definido no painel (Promoções): a loja paga o frete.
  if (!pickup && hasFreeShipping(await getPromotions(), subtotal)) freight = 0;
  // Pix: os produtos saem pelo preço do Pix (só com a taxa do Pix); a diferença aparece como desconto.
  const productsTotal = paymentMethod === "pix" ? round(items.reduce((sum, i, idx) => sum + pixPrices[idx] * i.qty, 0)) : subtotal;
  const paymentDiscount = round(subtotal - productsTotal);

  // Cupom: conferido de novo aqui (pode ter expirado desde que foi aplicado no carrinho).
  let coupon: Awaited<ReturnType<typeof checkCoupon>> | null = null;
  let couponError: string | null = null;
  if (body?.couponCode) {
    coupon = await checkCoupon(body.couponCode, subtotal);
    if ("error" in coupon) couponError = coupon.error;
  }
  // Pagando online, não cobra um valor diferente do que o cliente viu no carrinho.
  if (online && couponError) return reply(409, { error: `Cupom não aplicado: ${couponError} Remova o cupom no carrinho para continuar.` });

  let discount = 0;
  let couponCode: string | null = null;
  if (coupon && "coupon" in coupon) {
    if (await redeemCoupon(coupon.coupon.id)) {
      // O mínimo do cupom já foi conferido com o preço cheio; o desconto vale sobre o que o cliente paga nos produtos.
      discount = couponDiscount({ ...coupon.coupon, minSubtotal: null }, productsTotal);
      couponCode = coupon.coupon.code;
    } else {
      couponError = "Este cupom já atingiu o limite de usos.";
      if (online) return reply(409, { error: `Cupom não aplicado: ${couponError} Remova o cupom no carrinho para continuar.` });
    }
  }

  const total = round(productsTotal - discount + freight);

  const origin = cleanSource(body?.origin?.source, body?.origin?.campaign);

  let order;
  try {
    order = await createOrder({
      customerName, customerPhone, customerEmail,
      deliveryMode: pickup ? "pickup" : "delivery",
      address, shipping, items,
      subtotal, freight, discount, couponCode, paymentMethod, paymentDiscount, total,
      notes: str(body?.notes, 1000) || null,
      source: origin?.source ?? null,
      campaign: origin?.campaign || null
    });
  } catch (error) {
    console.error("Falha ao gravar pedido:", error);
    if (couponCode) await releaseCoupon(couponCode).catch(() => {});
    return reply(500, { error: "Não foi possível registrar o pedido." });
  }

  // Quem estava na lista de carrinhos abandonados comprou: sai da lista.
  await markCartRecovered(customerPhone, order.code).catch(() => {});

  const result = { code: order.code, token: order.publicToken, subtotal, discount, couponCode, couponError, paymentDiscount, freight, total };
  if (!online) return reply(200, result);

  // Cria a cobrança no Mercado Pago. Se falhar, o pedido é desfeito.
  const payer = { email: customerEmail!, name: customerName };
  const description = `Pedido nº ${order.code} - ${store.name}`;
  try {
    if (paymentMethod === "pix") {
      const pix = await createPixPayment({ code: order.code, total, payer, description });
      const paymentData = { pixCode: pix.pixCode, pixQrBase64: pix.pixQrBase64, pixExpiresAt: pix.pixExpiresAt };
      await setOrderPayment(order.id, { paymentId: pix.paymentId, paymentStatus: pix.status, paymentData });
      return reply(200, { ...result, pix: paymentData });
    }
    const card = await createCardCheckout({ code: order.code, token: order.publicToken, total, payer, description, installments: store.commerce.installments });
    await setOrderPayment(order.id, { paymentId: null, paymentStatus: "aguardando", paymentData: { checkoutUrl: card.checkoutUrl } });
    return reply(200, { ...result, checkoutUrl: card.checkoutUrl });
  } catch (error) {
    console.error("Falha ao criar pagamento no Mercado Pago:", error);
    const reason = error instanceof Error ? error.message : String(error);
    await saveLastError(`${paymentMethod === "pix" ? "Pix" : "Cartão"}: ${reason}`);
    await discardOrder(order.id).catch(() => {});
    if (couponCode) await releaseCoupon(couponCode).catch(() => {});
    return reply(502, { error: "Não foi possível iniciar o pagamento agora. Tente de novo ou finalize pelo WhatsApp." });
  }
}
