/*
  Vendas que quase aconteceram: carrinhos abandonados e "avise-me quando chegar".
*/
import { and, desc, eq, gte, isNull, sql } from "drizzle-orm";
import { getDb, hasDatabase } from "./client";
import { abandonedCarts, products, waitlist, type CartSnapshotItem } from "./schema";

export const phoneKey = (phone: string) => phone.replace(/\D/g, "").slice(-11);

// ---- Carrinho abandonado ----

/** Guarda (ou atualiza) o carrinho de quem preencheu nome e WhatsApp no checkout. */
export async function saveCartSnapshot(data: { name: string; phone: string; email: string | null; items: CartSnapshotItem[]; subtotal: number }) {
  if (!hasDatabase()) return;
  const key = phoneKey(data.phone);
  if (key.length < 10) return;
  await getDb().insert(abandonedCarts)
    .values({ phoneKey: key, ...data })
    .onConflictDoUpdate({
      target: abandonedCarts.phoneKey,
      // Carrinho novo depois de um pedido: volta a contar como aberto.
      set: { ...data, orderCode: null, contactedAt: null, updatedAt: new Date() }
    });
}

/** O pedido saiu: o carrinho dessa pessoa foi recuperado. */
export async function markCartRecovered(phone: string, orderCode: string) {
  if (!hasDatabase()) return;
  await getDb().update(abandonedCarts).set({ orderCode }).where(eq(abandonedCarts.phoneKey, phoneKey(phone)));
}

/** Carrinhos sem pedido há mais de 30 minutos, dos últimos 30 dias. */
export async function adminAbandonedCarts() {
  if (!hasDatabase()) return [];
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const quiet = new Date(Date.now() - 30 * 60 * 1000);
  const rows = await getDb().select().from(abandonedCarts)
    .where(and(isNull(abandonedCarts.orderCode), gte(abandonedCarts.updatedAt, since)))
    .orderBy(desc(abandonedCarts.updatedAt));
  return rows.filter(r => r.updatedAt <= quiet);
}

export async function adminRecoveredCount(days = 30) {
  if (!hasDatabase()) return 0;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const [row] = await getDb().select({ n: sql<number>`count(*)::int` }).from(abandonedCarts)
    .where(and(gte(abandonedCarts.updatedAt, since), sql`${abandonedCarts.orderCode} is not null and ${abandonedCarts.contactedAt} is not null`));
  return row?.n ?? 0;
}

export async function markCartContacted(id: number) {
  await getDb().update(abandonedCarts).set({ contactedAt: new Date() }).where(eq(abandonedCarts.id, id));
}

export async function deleteAbandonedCart(id: number) {
  await getDb().delete(abandonedCarts).where(eq(abandonedCarts.id, id));
}

// ---- Avise-me quando chegar ----

export async function addToWaitlist(data: { productId: number; size: string; name: string; phone: string }) {
  const db = getDb();
  // Mesmo telefone no mesmo produto/tamanho ainda sem aviso: não duplica.
  const [existing] = await db.select({ id: waitlist.id }).from(waitlist).where(and(
    eq(waitlist.productId, data.productId), eq(waitlist.size, data.size), isNull(waitlist.notifiedAt),
    sql`right(regexp_replace(${waitlist.phone}, '\\D', '', 'g'), 11) = ${phoneKey(data.phone)}`
  ));
  if (existing) return;
  await db.insert(waitlist).values(data);
}

/** Pedidos de aviso ainda não atendidos, com o estoque atual do tamanho. */
export async function adminWaitlist() {
  if (!hasDatabase()) return [];
  const rows = await getDb().select({
    id: waitlist.id, productId: waitlist.productId, size: waitlist.size, name: waitlist.name, phone: waitlist.phone,
    createdAt: waitlist.createdAt, productName: products.name, sizes: products.sizes
  }).from(waitlist)
    .innerJoin(products, eq(products.id, waitlist.productId))
    .where(isNull(waitlist.notifiedAt))
    .orderBy(desc(waitlist.createdAt));
  return rows.map(r => ({ ...r, stock: r.sizes.find(s => s.size === r.size)?.stock ?? r.sizes.reduce((n, s) => n + s.stock, 0) }));
}

export async function markWaitlistNotified(id: number) {
  await getDb().update(waitlist).set({ notifiedAt: new Date() }).where(eq(waitlist.id, id));
}

export async function deleteWaitlist(id: number) {
  await getDb().delete(waitlist).where(eq(waitlist.id, id));
}
