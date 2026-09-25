import { randomInt } from "node:crypto";
import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb, hasDatabase } from "./client";
import { orders, products, type NewOrderRow, type OrderRow } from "./schema";
import type { OrderStatus } from "@/lib/order-status";

/** Status em que o estoque do pedido fica descontado dos produtos. */
const holdsStock = (status: OrderStatus) => status !== "pendente" && status !== "cancelado";

const randomCode = () => String(randomInt(100000, 1000000));

const isUniqueViolation = (error: unknown) => {
  const e = error as { code?: string; cause?: { code?: string } };
  return (e?.cause?.code ?? e?.code) === "23505";
};

/** Grava o pedido com um código aleatório de 6 dígitos (tenta outro se já existir). */
export async function createOrder(data: Omit<NewOrderRow, "code">) {
  for (let attempt = 0; ; attempt++) {
    try {
      const [row] = await getDb().insert(orders).values({ ...data, code: randomCode() })
        .returning({ id: orders.id, code: orders.code });
      return row;
    } catch (error) {
      if (!isUniqueViolation(error) || attempt >= 5) throw error;
    }
  }
}

export async function adminListOrders(status?: OrderStatus): Promise<OrderRow[]> {
  if (!hasDatabase()) return [];
  const query = getDb().select().from(orders);
  return (status ? query.where(eq(orders.status, status)) : query).orderBy(desc(orders.id));
}

export async function adminGetOrder(id: number): Promise<OrderRow | null> {
  if (!hasDatabase()) return null;
  const [row] = await getDb().select().from(orders).where(eq(orders.id, id));
  return row ?? null;
}

export async function adminCountOrders(status: OrderStatus) {
  if (!hasDatabase()) return 0;
  return getDb().$count(orders, eq(orders.status, status));
}

/**
 * Soma (sign = 1) ou desconta (sign = -1) as quantidades do pedido no estoque
 * de cada tamanho. O estoque pode ficar negativo: isso indica venda acima do
 * disponível e mantém a devolução exata se o pedido for cancelado depois.
 */
async function moveStock(order: OrderRow, sign: 1 | -1) {
  const ids = [...new Set(order.items.map(i => i.productId))];
  if (!ids.length) return;
  const rows = await getDb().select({ id: products.id, sizes: products.sizes }).from(products).where(inArray(products.id, ids));
  for (const row of rows) {
    let changed = false;
    const sizes = row.sizes.map(s => {
      const qty = order.items
        .filter(i => i.productId === row.id && i.size === s.size)
        .reduce((sum, i) => sum + i.qty, 0);
      if (!qty) return s;
      changed = true;
      return { ...s, stock: s.stock + sign * qty };
    });
    if (changed) await getDb().update(products).set({ sizes }).where(eq(products.id, row.id));
  }
}

export async function adminSetOrderStatus(id: number, status: OrderStatus) {
  const order = await adminGetOrder(id);
  if (!order) throw new Error("Pedido não encontrado.");
  const apply = holdsStock(status);
  // Marca primeiro com a condição do valor antigo: dois cliques seguidos não descontam o estoque duas vezes.
  const [updated] = await getDb().update(orders)
    .set({ status, stockApplied: apply })
    .where(and(eq(orders.id, id), eq(orders.stockApplied, order.stockApplied)))
    .returning({ id: orders.id });
  if (!updated) throw new Error("O pedido foi alterado ao mesmo tempo em outra aba. Recarregue a página.");
  if (apply !== order.stockApplied) await moveStock(order, apply ? -1 : 1);
}

export async function adminUpdateOrder(id: number, data: Pick<NewOrderRow, "trackingCode" | "adminNotes">) {
  await getDb().update(orders).set(data).where(eq(orders.id, id));
}

export async function adminDeleteOrder(id: number) {
  const order = await adminGetOrder(id);
  if (!order) return;
  if (order.stockApplied) await moveStock(order, 1);
  await getDb().delete(orders).where(eq(orders.id, id));
}
