import type { OrderRow } from "@/db/schema";

export const METHOD_LABELS = { whatsapp: "Combinado no WhatsApp", pix: "Pix (Mercado Pago)", card: "Cartão (Mercado Pago)" } as const;

const MP_STATUS: Record<string, string> = {
  approved: "Aprovado",
  pending: "Aguardando pagamento",
  in_process: "Em análise",
  authorized: "Autorizado",
  rejected: "Recusado",
  cancelled: "Cancelado / expirado",
  refunded: "Devolvido",
  charged_back: "Contestado (chargeback)",
  aguardando: "Cliente ainda não pagou"
};

/** Resumo do pagamento para o painel. `ok` = pago. */
export function paymentSummary(order: Pick<OrderRow, "paymentMethod" | "paymentStatus" | "paidAt">) {
  if (order.paymentMethod === "whatsapp") return { label: "WhatsApp", ok: false };
  if (order.paidAt) return { label: "Pago", ok: true };
  return { label: MP_STATUS[order.paymentStatus ?? ""] ?? "Aguardando pagamento", ok: false };
}
