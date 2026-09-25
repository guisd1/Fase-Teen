import crypto from "node:crypto";
import { getStore } from "@/stores";

/*
  Pagamentos pelo Mercado Pago. Variáveis na Vercel (cada loja com a própria conta):
    MERCADO_PAGO_ACCESS_TOKEN    Access Token (Suas integrações → Credenciais).
                                 Tokens que começam com TEST- usam o ambiente de testes.
    MERCADO_PAGO_WEBHOOK_SECRET  Opcional: assinatura secreta das notificações (Webhooks).
  - Pix: o pagamento é criado aqui e o QR Code aparece no próprio site.
  - Cartão: o cliente paga na página do Mercado Pago (Checkout Pro) e volta para o site.
  A aprovação só é aceita depois de consultar o pagamento na API do Mercado Pago.
*/

const API = "https://api.mercadopago.com";

function accessToken() {
  return (process.env.MERCADO_PAGO_ACCESS_TOKEN ?? "").trim().replace(/^["']+|["']+$/g, "").replace(/^MERCADO_PAGO_ACCESS_TOKEN\s*=\s*/, "");
}

export const mercadoPagoConfigured = () => Boolean(accessToken());
export const mercadoPagoTestMode = () => accessToken().startsWith("TEST-");

/** Endereço que o Mercado Pago chama quando um pagamento muda de status. */
export const webhookUrl = () => `${getStore().siteUrl}/api/mercado-pago/webhook`;

async function mp<T>(path: string, init: { method?: string; body?: unknown; idempotencyKey?: string } = {}): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    method: init.method ?? "GET",
    headers: {
      "Authorization": `Bearer ${accessToken()}`,
      "Content-Type": "application/json",
      ...(init.idempotencyKey ? { "X-Idempotency-Key": init.idempotencyKey } : {})
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store"
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const cause = data?.cause?.[0]?.description || data?.message || data?.error;
    throw new Error(`Mercado Pago recusou (${response.status})${cause ? `: ${cause}` : ""}.`);
  }
  return data as T;
}

interface Payer {
  email: string;
  name: string;
}

const round = (n: number) => Math.round(n * 100) / 100;

/** Data no formato que o Mercado Pago aceita (com fuso de Brasília). */
function mpDate(date: Date) {
  const br = new Date(date.getTime() - 3 * 60 * 60 * 1000);
  return br.toISOString().replace("Z", "-03:00");
}

export async function createPixPayment(order: { code: string; total: number; payer: Payer; description: string }) {
  const expires = new Date(Date.now() + 30 * 60 * 1000);
  const [firstName, ...rest] = order.payer.name.trim().split(/\s+/);
  const data = await mp<{
    id: number;
    status: string;
    point_of_interaction?: { transaction_data?: { qr_code?: string; qr_code_base64?: string } };
  }>("/v1/payments", {
    method: "POST",
    // Clicar duas vezes no mesmo pedido não gera duas cobranças.
    idempotencyKey: `pix-${order.code}-${order.total}`,
    body: {
      transaction_amount: round(order.total),
      description: order.description,
      payment_method_id: "pix",
      external_reference: order.code,
      notification_url: webhookUrl(),
      date_of_expiration: mpDate(expires),
      payer: { email: order.payer.email, first_name: firstName, last_name: rest.join(" ") || undefined }
    }
  });
  const tx = data.point_of_interaction?.transaction_data;
  if (!tx?.qr_code) throw new Error("O Mercado Pago não devolveu o código Pix. Confira se a conta tem uma chave Pix cadastrada.");
  return {
    paymentId: String(data.id),
    status: data.status,
    pixCode: tx.qr_code,
    pixQrBase64: tx.qr_code_base64 ?? "",
    pixExpiresAt: expires.toISOString()
  };
}

export async function createCardCheckout(order: { code: string; token: string; total: number; payer: Payer; description: string; installments: number }) {
  const back = `${getStore().siteUrl}/pedido/${order.token}`;
  const data = await mp<{ init_point: string; sandbox_init_point?: string }>("/checkout/preferences", {
    method: "POST",
    body: {
      items: [{ id: order.code, title: order.description, quantity: 1, unit_price: round(order.total), currency_id: "BRL" }],
      payer: { email: order.payer.email, name: order.payer.name },
      external_reference: order.code,
      notification_url: webhookUrl(),
      back_urls: { success: back, pending: back, failure: back },
      auto_return: "approved",
      statement_descriptor: getStore().name.slice(0, 22),
      // Só cartão: Pix tem o próprio botão (com desconto) e boleto não é oferecido.
      payment_methods: {
        excluded_payment_types: [{ id: "ticket" }, { id: "bank_transfer" }, { id: "atm" }, { id: "digital_currency" }],
        installments: Math.max(1, order.installments)
      }
    }
  });
  return { checkoutUrl: (mercadoPagoTestMode() && data.sandbox_init_point) || data.init_point };
}

export interface MpPayment {
  id: string;
  status: string;
  externalReference: string | null;
  amount: number;
  method: string | null;
}

export async function getPayment(id: string): Promise<MpPayment> {
  const p = await mp<{ id: number; status: string; external_reference: string | null; transaction_amount: number; payment_type_id?: string }>(
    `/v1/payments/${encodeURIComponent(id)}`
  );
  return { id: String(p.id), status: p.status, externalReference: p.external_reference, amount: p.transaction_amount, method: p.payment_type_id ?? null };
}

/** Pagamentos já feitos para um pedido (usado para conferir o cartão na volta do checkout). */
export async function findPayments(orderCode: string): Promise<MpPayment[]> {
  const data = await mp<{ results: { id: number; status: string; external_reference: string | null; transaction_amount: number; payment_type_id?: string }[] }>(
    `/v1/payments/search?external_reference=${encodeURIComponent(orderCode)}&sort=date_created&criteria=desc`
  );
  return data.results.map(p => ({ id: String(p.id), status: p.status, externalReference: p.external_reference, amount: p.transaction_amount, method: p.payment_type_id ?? null }));
}

/**
 * Confere a assinatura da notificação (x-signature), quando MERCADO_PAGO_WEBHOOK_SECRET existe.
 * Sem o segredo, aceita: a notificação só serve de aviso, o status é sempre lido da API.
 */
export function validWebhookSignature(request: Request, dataId: string) {
  const secret = (process.env.MERCADO_PAGO_WEBHOOK_SECRET ?? "").trim();
  if (!secret) return true;
  const header = request.headers.get("x-signature") ?? "";
  const parts = Object.fromEntries(header.split(",").map(p => p.trim().split("=", 2) as [string, string]));
  if (!parts.ts || !parts.v1) return false;
  const requestId = request.headers.get("x-request-id") ?? "";
  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${parts.ts};`;
  const expected = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(parts.v1);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
