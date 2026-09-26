/*
  Números do painel: resumo de vendas, lucro estimado, estoque baixo e clientes.
  Tudo calculado a partir dos pedidos e produtos (a loja tem poucos pedidos por
  dia, então somar em memória é simples e rápido).
*/
import { getDb, hasDatabase } from "./client";
import { orders, products, type OrderRow, type ProductRow } from "./schema";
import { getSavedFees } from "./settings";
import { todayBR } from "./stats";
import type { PaymentFees } from "@/lib/pricing";

export const CONFIRMED = new Set(["preparacao", "enviado", "entregue"]);

const dayOf = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
const round = (n: number) => Math.round(n * 100) / 100;

/** Taxa do Mercado Pago que incide no pedido (pedido combinado no WhatsApp: sem taxa conhecida). */
const feeOf = (order: Pick<OrderRow, "paymentMethod">, fees: PaymentFees) =>
  order.paymentMethod === "pix" ? fees.pixPercent : order.paymentMethod === "card" ? fees.cardPercent : 0;

/**
 * Lucro estimado de um pedido: o que entra (total menos a taxa do Mercado Pago),
 * menos o frete repassado à transportadora (ou pago pela loja no frete grátis),
 * menos o custo das peças. `missingCost` avisa quando alguma peça não tem custo cadastrado.
 */
export function orderProfit(order: OrderRow, costs: Map<number, number | null>, fees: PaymentFees) {
  const received = order.total * (1 - feeOf(order, fees) / 100);
  const shippingPaid = order.deliveryMode === "pickup" ? 0 : (order.freight > 0 ? order.freight : order.shipping?.price ?? 0);
  let cost = 0, missingCost = false;
  for (const i of order.items) {
    const c = costs.get(i.productId);
    if (c === null || c === undefined) missingCost = true;
    else cost += c * i.qty;
  }
  return { profit: round(received - shippingPaid - cost), missingCost };
}

/** Parte do lucro de cada peça do pedido (rateado pelo valor da peça). */
export function itemProfits(order: OrderRow, costs: Map<number, number | null>, fees: PaymentFees) {
  // Quanto de fato entrou pelos produtos (descontos de cupom e do Pix aplicados), já sem a taxa.
  const productsCharged = Math.max(0, order.subtotal - order.discount - order.paymentDiscount);
  const ratio = order.subtotal > 0 ? productsCharged / order.subtotal : 0;
  const feeFactor = 1 - feeOf(order, fees) / 100;
  const freeShippingCost = order.deliveryMode !== "pickup" && order.freight === 0 ? order.shipping?.price ?? 0 : 0;
  return order.items.map(i => {
    const value = i.price * i.qty;
    const share = order.subtotal > 0 ? value / order.subtotal : 0;
    const c = costs.get(i.productId);
    return {
      productId: i.productId,
      profit: c === null || c === undefined ? null : round(value * ratio * feeFactor - freeShippingCost * share - c * i.qty)
    };
  });
}

export async function costMap(): Promise<Map<number, number | null>> {
  const rows = await getDb().select({ id: products.id, costPrice: products.costPrice }).from(products);
  return new Map(rows.map(r => [r.id, r.costPrice]));
}

export interface PeriodSummary { orders: number; revenue: number; ticket: number; profit: number; missingCost: boolean }

export interface Summary {
  today: PeriodSummary;
  week: PeriodSummary;
  month: PeriodSummary;
  pending: number;
  toShip: number;
  topProducts: { productId: number; name: string; qty: number; revenue: number }[];
  lowStock: { id: number; name: string; size: string; stock: number }[];
}

export async function adminSummary(): Promise<Summary> {
  const empty: PeriodSummary = { orders: 0, revenue: 0, ticket: 0, profit: 0, missingCost: false };
  if (!hasDatabase()) return { today: empty, week: empty, month: empty, pending: 0, toShip: 0, topProducts: [], lowStock: [] };
  const db = getDb();
  const [all, items, costs, fees] = await Promise.all([
    db.select().from(orders),
    db.select().from(products),
    costMap(),
    getSavedFees()
  ]);
  const today = todayBR();
  const back = (days: number) => { const d = new Date(`${today}T12:00:00Z`); d.setUTCDate(d.getUTCDate() - days); return d.toISOString().slice(0, 10); };
  const weekStart = back(6), monthStart = `${today.slice(0, 8)}01`, last30 = back(29);

  const confirmed = all.filter(o => CONFIRMED.has(o.status));
  const period = (from: string): PeriodSummary => {
    const list = confirmed.filter(o => dayOf(o.createdAt) >= from);
    const revenue = round(list.reduce((s, o) => s + o.total, 0));
    let profit = 0, missingCost = false;
    for (const o of list) { const p = orderProfit(o, costs, fees); profit += p.profit; missingCost ||= p.missingCost; }
    return { orders: list.length, revenue, ticket: list.length ? round(revenue / list.length) : 0, profit: round(profit), missingCost };
  };

  const byProduct = new Map<number, { productId: number; name: string; qty: number; revenue: number }>();
  for (const o of confirmed.filter(o => dayOf(o.createdAt) >= last30)) {
    for (const i of o.items) {
      const t = byProduct.get(i.productId) ?? { productId: i.productId, name: i.name, qty: 0, revenue: 0 };
      t.qty += i.qty;
      t.revenue = round(t.revenue + i.qty * i.price);
      byProduct.set(i.productId, t);
    }
  }

  return {
    today: period(today),
    week: period(weekStart),
    month: period(monthStart),
    pending: all.filter(o => o.status === "pendente").length,
    toShip: all.filter(o => o.status === "preparacao").length,
    topProducts: [...byProduct.values()].sort((a, b) => b.qty - a.qty).slice(0, 5),
    lowStock: lowStock(items)
  };
}

/** Tamanhos com 2 peças ou menos, dos produtos que estão no site. */
export function lowStock(items: ProductRow[]) {
  return items
    .filter(p => p.active && p.price !== null)
    .flatMap(p => p.sizes.filter(s => s.stock <= 2).map(s => ({ id: p.id, name: p.name, size: s.size, stock: s.stock })))
    .sort((a, b) => a.stock - b.stock);
}

// ---- Clientes ----

export interface Customer {
  key: string;
  name: string;
  phone: string;
  email: string | null;
  /** Pedidos confirmados e o total gasto neles. */
  orders: number;
  spent: number;
  /** Todos os pedidos, inclusive aguardando ou cancelados. */
  allOrders: number;
  lastOrder: Date;
  firstSource: string | null;
}

/** Clientes agrupados pelo telefone (últimos 11 dígitos). */
export async function adminCustomers(): Promise<Customer[]> {
  if (!hasDatabase()) return [];
  const all = await getDb().select().from(orders);
  const map = new Map<string, Customer>();
  for (const o of [...all].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())) {
    const key = o.customerPhone.replace(/\D/g, "").slice(-11) || o.customerName.toLowerCase();
    const c = map.get(key) ?? {
      key, name: o.customerName, phone: o.customerPhone, email: null, orders: 0, spent: 0, allOrders: 0,
      lastOrder: o.createdAt, firstSource: o.source ?? null
    };
    c.name = o.customerName;
    c.phone = o.customerPhone;
    c.email = o.customerEmail || c.email;
    c.allOrders += 1;
    c.lastOrder = o.createdAt;
    if (CONFIRMED.has(o.status)) { c.orders += 1; c.spent = round(c.spent + o.total); }
    map.set(key, c);
  }
  return [...map.values()];
}
