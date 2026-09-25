// Regra de desconto usada pelo carrinho (navegador) e pelo servidor ao gravar o pedido.

export interface CouponRule {
  code: string;
  type: "percent" | "fixed";
  value: number;
  minSubtotal: number | null;
}

export const normalizeCode = (code: unknown) => String(code ?? "").trim().toUpperCase().replace(/\s+/g, "").slice(0, 40);

/** Desconto em reais sobre os produtos (o frete não entra). Zero se não atingir o mínimo. */
export function couponDiscount(rule: CouponRule, subtotal: number) {
  if (subtotal <= 0 || (rule.minSubtotal && subtotal < rule.minSubtotal)) return 0;
  const raw = rule.type === "percent" ? subtotal * Math.min(rule.value, 100) / 100 : rule.value;
  return Math.round(Math.min(raw, subtotal) * 100) / 100;
}

export const couponLabel = (rule: Pick<CouponRule, "type" | "value">) =>
  rule.type === "percent"
    ? `${String(rule.value).replace(".", ",")}% off`
    : `${rule.value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} off`;
