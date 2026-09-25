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
export const pixPrice = (net: number, fees: PaymentFees) => withFee(net, fees.pixPercent);

/** Valida uma taxa digitada no painel ("4,98" ou "4.98"). */
export function parseFee(value: string, label: string) {
  const n = Number(value.trim().replace(",", "."));
  if (!Number.isFinite(n) || n < 0 || n >= 30) throw new Error(`${label}: informe uma porcentagem entre 0 e 30.`);
  return Math.round(n * 100) / 100;
}
