/*
  Etiquetas do Melhor Envio pelo painel:
    cotação (com as caixas) → carrinho do Melhor Envio → compra com o saldo da
    carteira → geração → impressão (PDF) → rastreio.
  Cada etapa grava o andamento no pedido; se algo falhar no meio (ex.: saldo
  insuficiente), tentar de novo continua de onde parou, sem comprar duas vezes.
  Envio sem nota fiscal: declaração de conteúdo (non_commercial).
*/
import { adminGetOrder, adminUpdateOrder } from "@/db/orders";
import { getLabelSender, type LabelSender } from "@/db/settings";
import type { OrderLabel, OrderRow } from "@/db/schema";
import { meApi } from "./melhor-envio";
import { quoteForLabel } from "./shipping-quote";
import { cleanCpf, isValidCpf } from "./cpf";
import { withRef } from "./format";
import { getStore } from "@/stores";

const digits = (v: unknown) => String(v ?? "").replace(/\D/g, "");

async function loadOrder(orderId: number) {
  const order = await adminGetOrder(orderId);
  if (!order) throw new Error("Pedido não encontrado.");
  if (order.deliveryMode === "pickup") throw new Error("Pedido de retirada na loja não precisa de etiqueta.");
  if (!order.address?.cep) throw new Error("O pedido está sem endereço de entrega.");
  return order;
}

async function saveLabel(order: OrderRow, label: OrderLabel) {
  await adminUpdateOrder(order.id, { label, ...(label.tracking ? { trackingCode: label.tracking } : {}) });
}

/** Opções de envio para este pedido, com preço de agora, e o saldo da carteira. */
export async function labelOptions(orderId: number) {
  const order = await loadOrder(orderId);
  const options = await quoteForLabel(order.address!.cep, order.items.map(i => ({ id: i.productId, quantity: i.qty })));
  let balance: number | null = null;
  try {
    const b = await meApi<{ balance?: number | string }>("/me/balance");
    balance = b?.balance === undefined ? null : Number(b.balance);
  } catch { /* sem permissão de saldo: segue sem mostrar */ }
  return {
    options: options.map(o => ({ id: o.id, company: o.company, service: o.service, price: o.price, deliveryTime: o.deliveryTime, boxes: o.packages.length })),
    balance,
    chosen: order.shipping?.serviceId
      ?? options.find(o => `${o.company} ${o.service}`.toLowerCase() === `${order.shipping?.company} ${order.shipping?.service}`.toLowerCase())?.id
      ?? null
  };
}

function party(p: { name: string; phone?: string | null; email?: string | null; document: string; postalCode: string; address: string; number: string; complement?: string | null; district: string; city: string; state: string }) {
  const doc = digits(p.document);
  return {
    name: p.name,
    phone: digits(p.phone),
    email: p.email || undefined,
    ...(doc.length === 14 ? { company_document: doc } : { document: doc }),
    address: p.address,
    complement: p.complement || "",
    number: p.number || "S/N",
    district: p.district,
    city: p.city,
    state_abbr: p.state.toUpperCase().slice(0, 2),
    country_id: "BR",
    postal_code: digits(p.postalCode)
  };
}

function checkSender(s: LabelSender | null): LabelSender {
  if (!s) throw new Error("Cadastre os dados do remetente em Integrações → Melhor Envio antes de comprar etiquetas.");
  const doc = digits(s.document);
  if (!(doc.length === 11 || doc.length === 14)) throw new Error("O CPF/CNPJ do remetente está incompleto (Integrações → Melhor Envio).");
  if (digits(s.postalCode).length !== 8 || !s.address || !s.city || !s.state) throw new Error("O endereço do remetente está incompleto (Integrações → Melhor Envio).");
  return s;
}

/**
 * Compra a etiqueta (ou continua uma compra que parou no meio).
 * `document` é o CPF da cliente, quando o pedido não tem.
 */
export async function buyLabel(orderId: number, serviceId: string, document?: string) {
  let order = await loadOrder(orderId);
  let label = order.label && order.label.status !== "canceled" ? order.label : null;

  if (!label) {
    const sender = checkSender(await getLabelSender());
    const cpf = cleanCpf(document || order.customerDocument);
    if (!isValidCpf(cpf)) throw new Error("Informe o CPF da cliente (ela precisa ter informado no pedido ou você pode pedir pelo WhatsApp).");
    if (cpf !== order.customerDocument) await adminUpdateOrder(order.id, { customerDocument: cpf });

    const quote = await quoteForLabel(order.address!.cep, order.items.map(i => ({ id: i.productId, quantity: i.qty })));
    const option = quote.find(o => o.id === String(serviceId));
    if (!option) throw new Error("Essa opção de envio não está disponível agora para este CEP. Escolha outra.");
    if (option.packages.length !== 1) {
      throw new Error(`O Melhor Envio dividiu este pedido em ${option.packages.length} caixas. Compre essa etiqueta direto no site do Melhor Envio (uma por caixa).`);
    }
    const box = option.packages[0];
    const a = order.address!;
    const store = getStore();
    const insurance = Math.round(order.items.reduce((s, i) => s + i.price * i.qty, 0) * 100) / 100;

    const cart = await meApi<{ id: string; protocol?: string; price?: number | string }>("/me/cart", {
      service: Number(option.id),
      from: party(sender),
      to: party({
        name: order.customerName, phone: order.customerPhone, email: order.customerEmail, document: cpf,
        postalCode: a.cep, address: a.address, number: a.number, complement: a.complement, district: a.district, city: a.city, state: a.state
      }),
      products: order.items.map(i => ({ name: withRef(i.name, i.reference).slice(0, 100), quantity: i.qty, unitary_value: i.price })),
      volumes: [box],
      options: {
        insurance_value: insurance,
        receipt: false,
        own_hand: false,
        reverse: false,
        non_commercial: true,
        platform: store.name,
        tags: [{ tag: `Pedido ${order.code}`, url: `${store.siteUrl}/admin/pedidos/${order.id}` }]
      }
    });
    label = {
      id: cart.id, protocol: cart.protocol ?? null, company: option.company, service: option.service,
      price: Number(cart.price ?? option.price), status: "cart", tracking: null, createdAt: new Date().toISOString()
    };
    await saveLabel(order, label);
    order = (await adminGetOrder(orderId))!;
  }

  if (label.status === "cart") {
    try {
      await meApi("/me/shipment/checkout", { orders: [label.id] });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "";
      throw new Error(/saldo|balance|insuficiente/i.test(msg)
        ? `Saldo insuficiente no Melhor Envio para pagar esta etiqueta (${label.price.toFixed(2).replace(".", ",")}). Coloque saldo na carteira e clique em Comprar de novo. ${msg}`
        : msg);
    }
    label = { ...label, status: "paid" };
    await saveLabel(order, label);
  }

  if (label.status === "paid") {
    await meApi("/me/shipment/generate", { orders: [label.id] });
    label = { ...label, status: "generated" };
    await saveLabel(order, label);
  }

  return refreshLabel(orderId);
}

/** Link do PDF da etiqueta para imprimir. */
export async function printLabel(orderId: number) {
  const order = await loadOrder(orderId);
  if (!order.label || !["generated", "posted", "delivered"].includes(order.label.status)) throw new Error("A etiqueta ainda não foi gerada.");
  const r = await meApi<{ url: string }>("/me/shipment/print", { mode: "public", orders: [order.label.id] });
  if (!r?.url) throw new Error("O Melhor Envio não devolveu o link da etiqueta.");
  return r.url;
}

/** Atualiza status e código de rastreio a partir do Melhor Envio. */
export async function refreshLabel(orderId: number) {
  const order = await loadOrder(orderId);
  const label = order.label;
  if (!label) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = await meApi<any>("/me/shipment/tracking", { orders: [label.id] });
  const info = r?.[label.id] ?? (Array.isArray(r) ? r[0] : r);
  const next: OrderLabel = {
    ...label,
    status: typeof info?.status === "string" && info.status ? (info.status === "released" ? "paid" : info.status) : label.status,
    tracking: info?.tracking || info?.melhorenvio_tracking || label.tracking,
    protocol: info?.protocol || label.protocol
  };
  await saveLabel(order, next);
  return next;
}

/** Cancela a etiqueta (o valor volta para a carteira se a transportadora ainda não foi avisada). */
export async function cancelLabel(orderId: number) {
  const order = await loadOrder(orderId);
  const label = order.label;
  if (!label || label.status === "canceled") throw new Error("Não há etiqueta para cancelar.");
  if (label.status === "cart") {
    await meApi(`/me/cart/${label.id}`, undefined, "DELETE").catch(() => {});
  } else {
    await meApi("/me/shipment/cancel", { order: { id: label.id, reason_id: "2", description: `Cancelada pelo painel (pedido ${order.code})` } });
  }
  await adminUpdateOrder(order.id, { label: { ...label, status: "canceled" } });
}
