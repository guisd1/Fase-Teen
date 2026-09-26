/*
  Conta visualizações, cliques e "adicionar ao carrinho" de cada produto
  (relatório no painel). Não guarda nada de quem visitou.
*/
export type TrackEvent = "view" | "click" | "cart" | "share" | "link" | "ad";

function send(body: string) {
  try {
    if (navigator.sendBeacon?.("/api/eventos", new Blob([body], { type: "text/plain" }))) return;
  } catch { /* segue para o fetch */ }
  fetch("/api/eventos", { method: "POST", body, keepalive: true }).catch(() => {});
}

/** Começo de uma visita: conta na origem (anúncio, Instagram, Google...). */
export function trackVisit(source: string, campaign: string) {
  send(JSON.stringify({ type: "visit", source, campaign }));
}

export function track(type: TrackEvent, productId: number) {
  try {
    // A mesma página recarregada várias vezes conta como uma visualização por sessão.
    if (type === "view" || type === "link" || type === "ad") {
      const key = `${type}:${productId}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    }
  } catch { /* navegação privada sem sessionStorage: conta mesmo assim */ }
  send(JSON.stringify({ type, productId }));
}

/**
 * true quando a visita começou direto nesta página, vinda de fora do site
 * (link no WhatsApp, Instagram, Google...). Navegar dentro da loja não conta.
 */
export function landedFromOutside() {
  try {
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    const first = nav ? new URL(nav.name).pathname : null;
    if (first !== location.pathname) return false;
    if (!document.referrer) return true;
    return new URL(document.referrer).host !== location.host;
  } catch {
    return false;
  }
}
