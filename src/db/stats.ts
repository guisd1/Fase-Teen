import { and, gte, inArray, sql } from "drizzle-orm";
import { getDb, hasDatabase } from "./client";
import { orders, productStats, products, trafficStats } from "./schema";

export type StatEvent = "view" | "click" | "cart" | "share" | "link" | "ad";

const COLUMN = { view: "views", click: "clicks", cart: "carts", share: "shares", link: "linkOpens", ad: "adOpens" } as const;

/** Dia de hoje no horário de Brasília (AAAA-MM-DD). */
export const todayBR = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });

/** Soma 1 no contador do produto no dia de hoje. */
export async function recordEvent(productId: number, event: StatEvent) {
  if (!hasDatabase()) return;
  const column = COLUMN[event];
  const one = { views: 0, clicks: 0, carts: 0, shares: 0, linkOpens: 0, adOpens: 0, [column]: 1 };
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
  shares: number;
  linkOpens: number;
  adOpens: number;
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
      carts: sql<number>`sum(${productStats.carts})::int`,
      shares: sql<number>`sum(${productStats.shares})::int`,
      linkOpens: sql<number>`sum(${productStats.linkOpens})::int`,
      adOpens: sql<number>`sum(${productStats.adOpens})::int`
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
    shares: byId.get(p.id)?.shares ?? 0,
    linkOpens: byId.get(p.id)?.linkOpens ?? 0,
    adOpens: byId.get(p.id)?.adOpens ?? 0,
    sold: sales.get(p.id)?.sold ?? 0,
    revenue: Math.round((sales.get(p.id)?.revenue ?? 0) * 100) / 100
  }));
}

// ---- Origem das visitas (tráfego pago, Instagram, Google...) ----

/** Soma 1 visita para a origem/campanha no dia de hoje. */
export async function recordVisit(source: string, campaign: string) {
  if (!hasDatabase()) return;
  await getDb().insert(trafficStats)
    .values({ day: todayBR(), source, campaign, visits: 1 })
    .onConflictDoUpdate({
      target: [trafficStats.day, trafficStats.source, trafficStats.campaign],
      set: { visits: sql`${trafficStats.visits} + 1` }
    });
}

export interface TrafficReportRow {
  source: string;
  campaign: string;
  visits: number;
  /** Pedidos confirmados (em preparação, enviados ou entregues) vindos desta origem. */
  orders: number;
  /** Valor desses pedidos (com frete). */
  revenue: number;
}

export async function adminTrafficReport(fromDay: string | null): Promise<TrafficReportRow[]> {
  if (!hasDatabase()) return [];
  const db = getDb();
  const [visits, sales] = await Promise.all([
    db.select({
      source: trafficStats.source,
      campaign: trafficStats.campaign,
      visits: sql<number>`sum(${trafficStats.visits})::int`
    }).from(trafficStats)
      .where(fromDay ? gte(trafficStats.day, fromDay) : undefined)
      .groupBy(trafficStats.source, trafficStats.campaign),
    db.select({
      source: orders.source,
      campaign: orders.campaign,
      orders: sql<number>`count(*)::int`,
      revenue: sql<number>`coalesce(sum(${orders.total}), 0)::float`
    }).from(orders).where(and(
      inArray(orders.status, ["preparacao", "enviado", "entregue"]),
      fromDay ? gte(orders.createdAt, new Date(`${fromDay}T00:00:00-03:00`)) : undefined
    )).groupBy(orders.source, orders.campaign)
  ]);
  const rows = new Map<string, TrafficReportRow>();
  const row = (source: string, campaign: string) => {
    const key = `${source}|${campaign}`;
    if (!rows.has(key)) rows.set(key, { source, campaign, visits: 0, orders: 0, revenue: 0 });
    return rows.get(key)!;
  };
  for (const v of visits) row(v.source, v.campaign).visits += v.visits;
  // Pedidos de antes deste relatório não têm origem: entram como "sem registro".
  for (const s of sales) {
    const r = row(s.source ?? "sem-registro", s.campaign ?? "");
    r.orders += s.orders;
    r.revenue = Math.round((r.revenue + s.revenue) * 100) / 100;
  }
  return [...rows.values()];
}

// ---- Evolução por dia (gráfico do relatório) ----

export interface DailyStat {
  day: string;
  views: number;
  clicks: number;
  carts: number;
  shares: number;
  linkOpens: number;
  adOpens: number;
  sold: number;
}

/** Números da loja inteira por dia, de `fromDay` até hoje (dias sem movimento vêm zerados). */
export async function adminDailyStats(fromDay: string | null): Promise<DailyStat[]> {
  if (!hasDatabase()) return [];
  const db = getDb();
  const [stats, confirmed] = await Promise.all([
    db.select({
      day: productStats.day,
      views: sql<number>`sum(${productStats.views})::int`,
      clicks: sql<number>`sum(${productStats.clicks})::int`,
      carts: sql<number>`sum(${productStats.carts})::int`,
      shares: sql<number>`sum(${productStats.shares})::int`,
      linkOpens: sql<number>`sum(${productStats.linkOpens})::int`,
      adOpens: sql<number>`sum(${productStats.adOpens})::int`
    }).from(productStats)
      .where(fromDay ? gte(productStats.day, fromDay) : undefined)
      .groupBy(productStats.day),
    db.select({ createdAt: orders.createdAt, items: orders.items }).from(orders).where(and(
      inArray(orders.status, ["preparacao", "enviado", "entregue"]),
      fromDay ? gte(orders.createdAt, new Date(`${fromDay}T00:00:00-03:00`)) : undefined
    ))
  ]);
  const dayOf = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
  const soldByDay = new Map<string, number>();
  for (const o of confirmed) {
    const d = dayOf(o.createdAt);
    soldByDay.set(d, (soldByDay.get(d) ?? 0) + o.items.reduce((n, i) => n + i.qty, 0));
  }
  const byDay = new Map(stats.map(s => [s.day, s]));
  // "Tudo": começa no primeiro dia com algum número.
  const first = fromDay ?? [...byDay.keys(), ...soldByDay.keys()].sort()[0] ?? todayBR();
  const out: DailyStat[] = [];
  for (let d = new Date(`${first}T12:00:00Z`); ; d.setUTCDate(d.getUTCDate() + 1)) {
    const day = d.toISOString().slice(0, 10);
    if (day > todayBR()) break;
    const s = byDay.get(day);
    out.push({
      day,
      views: s?.views ?? 0, clicks: s?.clicks ?? 0, carts: s?.carts ?? 0,
      shares: s?.shares ?? 0, linkOpens: s?.linkOpens ?? 0, adOpens: s?.adOpens ?? 0,
      sold: soldByDay.get(day) ?? 0
    });
  }
  return out;
}
