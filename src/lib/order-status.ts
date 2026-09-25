// Fica fora de src/db para poder ser usado nos componentes do navegador sem levar o drizzle junto.

export const ORDER_STATUSES = ["pendente", "preparacao", "enviado", "entregue", "cancelado"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pendente: "Aguardando confirmação",
  preparacao: "Em preparação",
  enviado: "Enviado",
  entregue: "Entregue",
  cancelado: "Cancelado"
};

export const isOrderStatus = (v: unknown): v is OrderStatus => ORDER_STATUSES.includes(v as OrderStatus);
