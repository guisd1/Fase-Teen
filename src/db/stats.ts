import { and, gte, inArray, sql } from "drizzle-orm";
import { getDb, hasDatabase } from "./client";
import { orders, productStats, products } from "./schema";

export type StatEvent = "view" | "click" | "cart";

const COLUMN = { view: "views", click: "clicks", cart: "carts" } as const;

/** Dia de hoje no horário de Brasília (AAAA-MM-DD). */
export const todayBR = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });

/** Soma 1 no contador do produto no dia de hoje. */
export async function recordEvent(productId: number, event: StatEvent) {
  if (!hasDatabase()) return;
  const column = COLUMN[event];
  const one = { views: 0, clicks: 0, carts: 0, [column]: 1 };
  await getDb().insert(productStats)
    .values({ productId, day: todayBR(), ...one })
    .onConflictDoUpdate({
      target: [productStats.productId, productStats.day],
      set: { [column]: sql`${productStats[column]} + 1` }
    });
}

export interface ProductReportRow {
  id: number;
  name: string;
  reference: string | null;
  image: string | null;
  active: boolean;
  views: number;
  clicks: number;
  carts: number;
  /** Peças vendidas em pedidos confirmados (em preparação, enviados ou entregues). */
  sold: number;
  revenue: number;
}

/** Relatório por produto desde `fromDay` (AAAA-MM-DD, horário de Brasília) ou de todo o período. */
export async function adminProductReport(fromDay: string | null): Promise<ProductReportRow[]> {
  if (!hasDatabase()) return [];
  const db = getDb();
  const [items, stats, confirmed] = await Promise.all([
    db.select({ id: products.id, name: products.name, reference: products.reference, images: products.images, active: products.active }).from(products),
    db.select({
      productId: productStats.productId,
      views: sql<number>`sum(${productStats.views})::int`,
      clicks: sql<number>`sum(${productStats.clicks})::int`,
      carts: sql<number>`sum(${productStats.carts})::int`
    }).from(productStats)
      .where(fromDay ? gte(productStats.day, fromDay) : undefined)
      .groupBy(productStats.productId),
    db.select({ items: orders.items }).from(orders).where(and(
      inArray(orders.status, ["preparacao", "enviado", "entregue"]),
      fromDay ? gte(orders.createdAt, new Date(`${fromDay}T00:00:00-03:00`)) : undefined
    ))
  ]);

  const byId = new Map(stats.map(s => [s.productId, s]));
  const sales = new Map<number, { sold: number; revenue: number }>();
  for (const o of confirmed) {
    for (const i of o.items) {
      const s = sales.get(i.productId) ?? { sold: 0, revenue: 0 };
      s.sold += i.qty;
      s.revenue += i.qty * i.price;
      sales.set(i.productId, s);
    }
  }
  return items.map(p => ({
    id: p.id,
    name: p.name,
    reference: p.reference,
    image: p.images[0]?.src ?? null,
    active: p.active,
    views: byId.get(p.id)?.views ?? 0,
    clicks: byId.get(p.id)?.clicks ?? 0,
    carts: byId.get(p.id)?.carts ?? 0,
    sold: sales.get(p.id)?.sold ?? 0,
    revenue: Math.round((sales.get(p.id)?.revenue ?? 0) * 100) / 100
  }));
}
