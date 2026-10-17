import type { Product } from "@/db/products";

/*
  A página fica guardada em cache por alguns segundos (às vezes mais, com pouco movimento).
  Por isso o produto traz os dois preços da promoção com data, e o navegador escolhe
  o certo pelo relógio: a promoção começa e acaba na hora, mesmo numa página antiga.
  O valor cobrado é sempre recalculado no servidor ao fechar o pedido.
*/

const time = (iso: string | null, fallback: number) => (iso ? Date.parse(iso) : fallback);

/** Produto com o preço que vale no instante `now`. */
export function liveProduct(p: Product, now: number): Product {
  const s = p.schedule;
  if (!s) return p;
  const on = now >= time(s.startsAt, -Infinity) && now < time(s.endsAt, Infinity);
  return { ...p, ...(on ? s.sale : s.regular), promo: on ? { percent: s.percent, endsAt: s.endsAt } : null };
}

/** Próximo instante em que algum preço muda (começo ou fim de promoção), ou null. */
export function nextPriceChange(products: Product[], now: number): number | null {
  let next: number | null = null;
  for (const p of products) {
    for (const iso of [p.schedule?.startsAt, p.schedule?.endsAt]) {
      const t = iso ? Date.parse(iso) : NaN;
      if (t > now && (next === null || t < next)) next = t;
    }
  }
  return next;
}
