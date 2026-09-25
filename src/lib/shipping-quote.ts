import { getShippingInfo } from "@/db/products";
import { cleanCep } from "@/lib/format";
import { ME_URL, getAccessToken, getUserAgent } from "@/lib/melhor-envio";
import type { ShippingOption } from "@/lib/shipping";

/** Erro com o status HTTP que a rota de frete deve devolver. */
export class QuoteError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// A resposta do Melhor Envio varia entre versões da API, por isso os campos são lidos com fallback.
type RawQuote = any; // eslint-disable-line @typescript-eslint/no-explicit-any

function quoteList(payload: unknown): RawQuote[] {
  return Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { data?: unknown })?.data) ? (payload as { data: RawQuote[] }).data : [];
}

/** Motivos que as transportadoras deram para recusar a cotação (ex.: peso ou medidas fora do limite). */
function unavailableReasons(payload: unknown): string[] {
  return quoteList(payload)
    .filter(q => q?.error || q?.status === "unavailable")
    .map(q => {
      const name = [q.company?.name, q.name].filter(Boolean).join(" ") || "Transportadora";
      const reason = typeof q.error === "string" ? q.error : q.error?.message ?? q.message ?? "indisponível";
      return `${name}: ${reason}`;
    });
}

function normalizeQuotes(payload: unknown): ShippingOption[] {
  return quoteList(payload)
    .filter(q => !q?.error && q?.status !== "unavailable")
    .map((q, index) => ({
      id: String(q.id ?? q.service_id ?? q.service?.id ?? index),
      company: q.company?.name ?? q.company_name ?? q.company?.company_name ?? "Transportadora",
      service: q.name ?? q.service_name ?? q.service?.name ?? "",
      price: Number(q.custom_price ?? q.price ?? q.amount ?? NaN),
      deliveryTime: Number(q.custom_delivery_time ?? q.delivery_time ?? q.delivery_days ?? NaN)
    }))
    .filter(q => Number.isFinite(q.price) && q.price >= 0)
    .map(q => ({ ...q, deliveryTime: Number.isFinite(q.deliveryTime) ? q.deliveryTime : null }))
    .sort((a, b) => a.price - b.price);
}

function doQuote(token: string, payload: unknown) {
  return fetch(`${ME_URL}/api/v2/me/shipment/calculate`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/json",
      "Content-Type": "application/json",
      "User-Agent": getUserAgent()
    },
    body: JSON.stringify(payload)
  });
}

/**
 * Cota o frete no Melhor Envio com peso, medidas e preço lidos do banco.
 * Usada pelo carrinho e, de novo, ao gravar um pedido pago online (o valor do
 * frete que o navegador manda nunca é usado para cobrar).
 */
export async function quoteShipping(postalCode: unknown, items: { id: unknown; quantity: unknown }[]) {
  const origin = cleanCep(process.env.STORE_ORIGIN_POSTAL_CODE);
  const services = String(process.env.MELHOR_ENVIO_SERVICES || "").trim();
  if (origin.length !== 8) throw new QuoteError(500, "Frete ainda não configurado: STORE_ORIGIN_POSTAL_CODE ausente ou inválido.");

  const destination = cleanCep(postalCode);
  if (destination.length !== 8) throw new QuoteError(400, "CEP de destino inválido.");
  if (!items.length) throw new QuoteError(400, "Carrinho vazio.");

  const ids = [...new Set(items.map(i => Number(i?.id)).filter(Number.isInteger))];
  let catalog;
  try {
    catalog = await getShippingInfo(ids);
  } catch (error) {
    throw new QuoteError(500, error instanceof Error ? error.message : "Não foi possível ler os produtos.");
  }

  const payloadProducts = [];
  for (const item of items) {
    const product = catalog.find(p => p.id === Number(item?.id));
    const quantity = Math.max(1, Math.min(50, Number(item?.quantity) || 1));
    if (!product) throw new QuoteError(400, `Produto ${item?.id} não encontrado.`);
    if (![product.weightKg, product.heightCm, product.widthCm, product.lengthCm].every(v => v && v > 0)) {
      throw new QuoteError(422, `O produto "${product.name}" está sem peso/dimensões para o frete. Escolha retirada na loja ou fale com a gente no WhatsApp.`);
    }
    payloadProducts.push({
      id: String(product.id),
      width: product.widthCm, height: product.heightCm, length: product.lengthCm,
      weight: product.weightKg, insurance_value: Number(product.price.toFixed(2)), quantity
    });
  }

  const payload: Record<string, unknown> = {
    from: { postal_code: origin },
    to: { postal_code: destination },
    products: payloadProducts,
    options: { receipt: false, own_hand: false }
  };
  if (services) payload.services = services;

  let token: string;
  try {
    token = await getAccessToken(false);
  } catch (error) {
    throw new QuoteError(401, error instanceof Error ? error.message : "Melhor Envio ainda não autorizado.");
  }

  let response: Response;
  try {
    response = await doQuote(token, payload);
    if (response.status === 401) {
      try {
        token = await getAccessToken(true);
      } catch (refreshError) {
        throw new QuoteError(401, refreshError instanceof Error ? refreshError.message : "A autorização do Melhor Envio expirou. Autorize novamente.");
      }
      response = await doQuote(token, payload);
    }
  } catch (error) {
    if (error instanceof QuoteError) throw error;
    throw new QuoteError(502, error instanceof Error ? error.message : "Não foi possível conectar ao Melhor Envio agora.");
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new QuoteError(502, data?.message || data?.error || "O Melhor Envio recusou a cotação.");
  const options = normalizeQuotes(data);
  const unavailable = options.length ? [] : unavailableReasons(data);
  if (!options.length) console.warn("Frete sem opções:", JSON.stringify({ payload, unavailable }));
  return { options, unavailable, postalCode: destination };
}
