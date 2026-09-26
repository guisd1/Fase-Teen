import { recordEvent, recordVisit, type StatEvent } from "@/db/stats";
import { cleanSource } from "@/lib/traffic-source";
import { rateLimited } from "@/lib/redis";

export const dynamic = "force-dynamic";

const EVENTS: StatEvent[] = ["view", "click", "cart", "share", "link", "ad"];
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse/i;

/**
 * Contadores do relatório de produtos (visualização, clique na vitrine,
 * adicionar ao carrinho, compartilhamento e visita vinda de link de fora). Enviado pelo navegador com sendBeacon.
 */
export async function POST(request: Request) {
  if (BOT.test(request.headers.get("user-agent") ?? "")) return new Response(null, { status: 204 });
  // Limite por IP: evita que alguém infle os números de propósito.
  if (await rateLimited(request, "eventos", 600, 60 * 60)) return new Response(null, { status: 204 });
  let body: { type?: unknown; productId?: unknown; source?: unknown; campaign?: unknown };
  try {
    body = JSON.parse(await request.text());
  } catch {
    return new Response(null, { status: 400 });
  }
  // Começo de uma visita: conta na origem (anúncio, Instagram, Google...).
  if (body.type === "visit") {
    const src = cleanSource(body.source, body.campaign);
    if (!src) return new Response(null, { status: 400 });
    await recordVisit(src.source, src.campaign).catch(() => {});
    return new Response(null, { status: 204 });
  }
  const productId = Number(body.productId);
  const type = body.type as StatEvent;
  if (!EVENTS.includes(type) || !Number.isInteger(productId) || productId <= 0) return new Response(null, { status: 400 });
  try {
    await recordEvent(productId, type);
  } catch {
    // Produto que não existe mais: ignora.
  }
  return new Response(null, { status: 204 });
}
