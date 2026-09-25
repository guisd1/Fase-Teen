import type { OrderRow, OrderStatus } from "@/db/schema";
import type { StoreConfig } from "@/stores/types";

export const trackingUrl = (code: string) => `https://melhorrastreio.com.br/rastreio/${encodeURIComponent(code)}`;

/** Número do cliente no formato do wa.me (com DDI 55). Null se não parecer um celular/telefone brasileiro. */
export function customerWhatsapp(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) return digits;
  return null;
}

/** Mensagem para avisar o cliente sobre o status atual do pedido. */
export function statusMessage(store: StoreConfig, order: Pick<OrderRow, "id" | "customerName" | "status" | "trackingCode" | "deliveryMode">) {
  const name = order.customerName.split(" ")[0];
  const n = `seu pedido nº ${order.id} na *${store.name}*`;
  const texts: Record<OrderStatus, string> = {
    pendente: `Olá, ${name}! Recebemos ${n}. Já vamos conferir o estoque e te passar os dados para pagamento.`,
    preparacao: `Olá, ${name}! O pagamento de ${n} foi confirmado e ele já está em preparação. 💕`,
    enviado: order.deliveryMode === "pickup"
      ? `Olá, ${name}! ${capitalize(n)} está pronto para retirada na loja. 🛍`
      : `Olá, ${name}! ${capitalize(n)} foi enviado! 📦` +
        (order.trackingCode ? `\nCódigo de rastreio: ${order.trackingCode}\nAcompanhe: ${trackingUrl(order.trackingCode)}` : ""),
    entregue: `Olá, ${name}! ${capitalize(n)} foi entregue. Esperamos que você ame! Se puder, conta pra gente o que achou avaliando o produto no site. 💖`,
    cancelado: `Olá, ${name}. ${capitalize(n)} foi cancelado. Se tiver qualquer dúvida, é só chamar por aqui.`
  };
  return texts[order.status];
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
