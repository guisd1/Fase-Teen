/*
  Preço com a taxa do Mercado Pago embutida.
  O administrador cadastra quanto quer RECEBER por produto; o site mostra o
  preço já com a taxa, de modo que, depois que o Mercado Pago desconta a
  tarifa, sobra exatamente o valor cadastrado:
    preço = valor a receber ÷ (1 − taxa)
  Ex.: R$ 100 com 4,98% no cartão → R$ 105,25; com 0,99% no Pix → R$ 101,00.
*/

export interface PaymentFees {
  /** Tarifa do Pix no Mercado Pago (%). */
  pixPercent: number;
  /** Tarifa do cartão de crédito à vista no Mercado Pago (%), conforme o prazo de recebimento. */
  cardPercent: number;
}

/** Valores de referência do Mercado Pago (ajustáveis no painel). */
export const DEFAULT_FEES: PaymentFees = { pixPercent: 0.99, cardPercent: 4.98 };

/** Sem Mercado Pago não há tarifa a repassar. */
export const NO_FEES: PaymentFees = { pixPercent: 0, cardPercent: 0 };

/** Valor a receber + taxa, arredondado para cima no centavo (nunca recebe menos). */
export function withFee(net: number, percent: number) {
  if (!percent) return Math.round(net * 100) / 100;
  return Math.ceil(net / (1 - percent / 100) * 100 - 1e-6) / 100;
}

export const cardPrice = (net: number, fees: PaymentFees) => withFee(net, fees.cardPercent);
/** Sobe para o próximo valor terminado em ,99 (R$ 242,42 → R$ 242,99). */
export const endIn99 = (value: number) => Math.round((Math.floor(value + 1e-6) + 0.99) * 100) / 100;

/**
 * Preço no Pix: valor a receber + taxa do Pix, arredondado para cima até ,99.
 * Nunca passa do preço no cartão (em peças baratas o arredondamento poderia passar).
 */
export const pixPrice = (net: number, fees: PaymentFees) =>
  Math.min(endIn99(withFee(net, fees.pixPercent)), cardPrice(net, fees));

/** Valida uma taxa digitada no painel ("4,98" ou "4.98"). */
export function parseFee(value: string, label: string) {
  const n = Number(value.trim().replace(",", "."));
  if (!Number.isFinite(n) || n < 0 || n >= 30) throw new Error(`${label}: informe uma porcentagem entre 0 e 30.`);
  return Math.round(n * 100) / 100;
}

export type MarkupType = "percent" | "fixed";

/**
 * Valor a receber a partir do custo da peça e do mark-up:
 *   percent: custo × (1 + mark-up / 100)   ex.: 80 com 100% → 160
 *   fixed:   custo + mark-up               ex.: 80 + 70     → 150
 */
export function priceFromMarkup(cost: number, type: MarkupType, markup: number) {
  const value = type === "percent" ? cost * (1 + markup / 100) : cost + markup;
  return Math.round(value * 100) / 100;
}
