/*
  Notificação de pedido novo no celular/computador (Web Push), mesmo com o
  painel fechado. As chaves VAPID são criadas na primeira vez e ficam no banco
  da loja (nada para configurar na Vercel). Cada aparelho ativa no painel.
*/
import webpush from "web-push";
import { eq } from "drizzle-orm";
import { getDb, hasDatabase } from "@/db/client";
import { pushSubscriptions, settings, type OrderRow } from "@/db/schema";
import { getStore } from "@/stores";
import { money } from "./format";

const VAPID_KEY = "vapid-keys";

export async function vapidKeys(): Promise<{ publicKey: string; privateKey: string }> {
  const db = getDb();
  const [row] = await db.select().from(settings).where(eq(settings.key, VAPID_KEY));
  if (row) return row.value as { publicKey: string; privateKey: string };
  const keys = webpush.generateVAPIDKeys();
  // Se duas requisições criarem ao mesmo tempo, vale a primeira gravada.
  await db.insert(settings).values({ key: VAPID_KEY, value: keys }).onConflictDoNothing();
  const [saved] = await db.select().from(settings).where(eq(settings.key, VAPID_KEY));
  return saved.value as { publicKey: string; privateKey: string };
}

export async function saveSubscription(sub: { endpoint: string; keys: { p256dh: string; auth: string } }, device: string) {
  await getDb().insert(pushSubscriptions).values({ endpoint: sub.endpoint, keys: sub.keys, device })
    .onConflictDoUpdate({ target: pushSubscriptions.endpoint, set: { keys: sub.keys, device } });
}

export async function removeSubscription(endpoint: string) {
  await getDb().delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
}

export async function countSubscriptions() {
  if (!hasDatabase()) return 0;
  return getDb().$count(pushSubscriptions);
}

/** Envia para todos os aparelhos ativados. Aparelho que não existe mais sai da lista. Nunca lança erro. */
export async function pushToAdmins(payload: { title: string; body: string; url: string; tag?: string }) {
  try {
    if (!hasDatabase()) return;
    const subs = await getDb().select().from(pushSubscriptions);
    if (!subs.length) return;
    const { publicKey, privateKey } = await vapidKeys();
    const store = getStore();
    webpush.setVapidDetails(store.siteUrl, publicKey, privateKey);
    const data = JSON.stringify({ ...payload, icon: store.logo.icon ?? undefined });
    await Promise.all(subs.map(async s => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: s.keys }, data, { TTL: 60 * 60 * 24, urgency: "high" });
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) await removeSubscription(s.endpoint);
        else console.error("Push:", status, (error as Error).message);
      }
    }));
  } catch (error) {
    console.error("Notificação push:", error);
  }
}

/** "Pedido novo" (qualquer pedido, pago ou não) e "pagamento aprovado". */
export function notifyOrderPush(order: OrderRow, kind: "new" | "paid") {
  const who = order.customerName.split(" ")[0];
  return pushToAdmins({
    title: kind === "paid" ? `Pagamento aprovado • ${money(order.total)}` : `Pedido novo • ${money(order.total)}`,
    body: `nº ${order.code} • ${who} • ${order.items.reduce((n, i) => n + i.qty, 0)} peça(s)`,
    url: `/admin/pedidos/${order.id}`,
    tag: `pedido-${order.id}-${kind}`
  });
}
