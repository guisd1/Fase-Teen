/*
  De onde veio a visita. Usado no relatório do painel (visitas e pedidos por
  origem) e para saber se o tráfego pago está trazendo vendas.

  Anúncio: links com utm_medium de mídia paga (cpc, paid, ads...) ou com
  gclid (Google Ads). No Meta Ads, configure em "Parâmetros de URL":
    utm_source=meta&utm_medium=paid&utm_campaign={{campaign.name}}
*/
export const SOURCE_LABELS: Record<string, string> = {
  anuncio: "Anúncio (tráfego pago)",
  instagram: "Instagram",
  facebook: "Facebook",
  google: "Google (busca)",
  whatsapp: "WhatsApp",
  tiktok: "TikTok",
  youtube: "YouTube",
  outros: "Outros sites",
  direto: "Direto (digitou o endereço ou link sem origem)"
};
export const SOURCES = Object.keys(SOURCE_LABELS);

export interface TrafficSource { source: string; campaign: string }

const PAID = /^(cpc|ppc|paid|paid_?social|paidsocial|ads?|anuncio|cpm|display|social_?paid)$/i;

const fromHost = (host: string) => {
  const h = host.replace(/^www\./, "").toLowerCase();
  if (/instagram\.com$/.test(h)) return "instagram";
  if (/(facebook\.com|fb\.com|fb\.me|messenger\.com)$/.test(h)) return "facebook";
  if (/(^|\.)google\./.test(h)) return "google";
  if (/(whatsapp\.com|wa\.me|whatsapp\.net)$/.test(h)) return "whatsapp";
  if (/tiktok\.com$/.test(h)) return "tiktok";
  if (/(youtube\.com|youtu\.be)$/.test(h)) return "youtube";
  return "outros";
};

/** Origem desta visita, pelo link (utm, gclid) ou pelo site de onde a pessoa veio. */
export function detectSource(): TrafficSource {
  const q = new URLSearchParams(location.search);
  const utmSource = (q.get("utm_source") ?? "").trim().toLowerCase();
  const utmMedium = (q.get("utm_medium") ?? "").trim();
  const campaign = (q.get("utm_campaign") ?? "").trim().slice(0, 80);
  if (PAID.test(utmMedium) || q.has("gclid") || q.has("gbraid") || q.has("wbraid")) {
    return { source: "anuncio", campaign: campaign || (q.has("gclid") ? "Google Ads" : utmSource) || "sem nome" };
  }
  if (utmSource) {
    const known = SOURCES.find(s => utmSource.includes(s)) ?? (utmSource.includes("ig") ? "instagram" : utmSource.includes("fb") || utmSource.includes("meta") ? "facebook" : "outros");
    return { source: known, campaign };
  }
  try {
    if (document.referrer) {
      const ref = new URL(document.referrer);
      if (ref.host !== location.host) return { source: fromHost(ref.host), campaign: "" };
    }
  } catch { /* referrer inválido */ }
  return { source: "direto", campaign: "" };
}

const LAST = "origem";
const DAYS_30 = 30 * 24 * 60 * 60 * 1000;

/**
 * Chamado no começo de cada visita: devolve a origem (uma vez por visita) e
 * guarda a última origem que não foi "direto" por 30 dias, para o pedido
 * feito depois (ex.: viu o anúncio hoje e comprou amanhã digitando o site).
 */
export function startVisit(): TrafficSource | null {
  try {
    if (sessionStorage.getItem("visita")) return null;
    const src = detectSource();
    sessionStorage.setItem("visita", JSON.stringify(src));
    if (src.source !== "direto" || !localStorage.getItem(LAST)) {
      localStorage.setItem(LAST, JSON.stringify({ ...src, at: Date.now() }));
    }
    return src;
  } catch {
    return null;
  }
}

/** Origem que vai junto com o pedido. */
export function orderSource(): TrafficSource | null {
  try {
    const last = JSON.parse(localStorage.getItem(LAST) ?? "null");
    if (last && Date.now() - last.at < DAYS_30) return { source: last.source, campaign: last.campaign ?? "" };
    return JSON.parse(sessionStorage.getItem("visita") ?? "null");
  } catch {
    return null;
  }
}

/** Limpa o que vem do navegador antes de gravar. */
export function cleanSource(source: unknown, campaign: unknown): TrafficSource | null {
  const s = String(source ?? "").toLowerCase();
  if (!SOURCES.includes(s)) return null;
  const c = String(campaign ?? "").replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, 80);
  return { source: s, campaign: s === "anuncio" || c ? c : "" };
}
