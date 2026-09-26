/*
  Conta visualizações, cliques e "adicionar ao carrinho" de cada produto
  (relatório no painel). Não guarda nada de quem visitou.
*/
export type TrackEvent = "view" | "click" | "cart";

export function track(type: TrackEvent, productId: number) {
  try {
    // A mesma página recarregada várias vezes conta como uma visualização por sessão.
    if (type === "view") {
      const key = `viu:${productId}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    }
  } catch { /* navegação privada sem sessionStorage: conta mesmo assim */ }
  const body = JSON.stringify({ type, productId });
  try {
    if (navigator.sendBeacon?.("/api/eventos", new Blob([body], { type: "text/plain" }))) return;
  } catch { /* segue para o fetch */ }
  fetch("/api/eventos", { method: "POST", body, keepalive: true }).catch(() => {});
}
