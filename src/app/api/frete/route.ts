import { getShippingInfo } from "@/db/products";
import { cleanCep } from "@/lib/format";
import { ME_URL, getAccessToken, getUserAgent } from "@/lib/melhor-envio";
import type { ShippingOption } from "@/lib/shipping";

export const dynamic = "force-dynamic";

const reply = (status: number, body: unknown) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

// A resposta do Melhor Envio varia entre versões da API, por isso os campos são lidos com fallback.
type RawQuote = any; // eslint-disable-line @typescript-eslint/no-explicit-any

function normalizeQuotes(payload: unknown): ShippingOption[] {
  const list: RawQuote[] = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { data?: unknown })?.data) ? (payload as { data: RawQuote[] }).data : [];
  return list
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

export async function POST(request: Request) {
  const origin = cleanCep(process.env.STORE_ORIGIN_POSTAL_CODE);
  const services = String(process.env.MELHOR_ENVIO_SERVICES || "").trim();
  if (origin.length !== 8) return reply(500, { error: "Frete ainda não configurado: STORE_ORIGIN_POSTAL_CODE ausente ou inválido." });

  const body = await request.json().catch(() => ({}));
  const destination = cleanCep(body?.postalCode);
  const items: unknown = body?.items;
  if (destination.length !== 8) return reply(400, { error: "CEP de destino inválido." });
  if (!Array.isArray(items) || !items.length) return reply(400, { error: "Carrinho vazio." });

  const ids = [...new Set(items.map(i => Number(i?.id)).filter(Number.isInteger))];
  let catalog;
  try {
    catalog = await getShippingInfo(ids);
  } catch (error) {
    return reply(500, { error: error instanceof Error ? error.message : "Não foi possível ler os produtos." });
  }

  const payloadProducts = [];
  for (const item of items) {
    const product = catalog.find(p => p.id === Number(item?.id));
    const quantity = Math.max(1, Math.min(50, Number(item?.quantity) || 1));
    if (!product) return reply(400, { error: `Produto ${item?.id} não encontrado.` });
    if (![product.weightKg, product.heightCm, product.widthCm, product.lengthCm].every(v => v && v > 0)) {
      return reply(422, { error: `O produto "${product.name}" está sem peso/dimensões para o frete. Escolha retirada na loja ou fale com a gente no WhatsApp.` });
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

  try {
    let token: string;
    try {
      token = await getAccessToken(false);
    } catch (error) {
      return reply(401, { error: error instanceof Error ? error.message : "Melhor Envio ainda não autorizado." });
    }

    let response = await doQuote(token, payload);
    if (response.status === 401) {
      try {
        token = await getAccessToken(true);
        response = await doQuote(token, payload);
      } catch (refreshError) {
        return reply(401, { error: refreshError instanceof Error ? refreshError.message : "A autorização do Melhor Envio expirou. Autorize novamente." });
      }
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return reply(502, { error: data?.message || data?.error || "O Melhor Envio recusou a cotação." });
    }
    return reply(200, { options: normalizeQuotes(data), postalCode: destination });
  } catch (error) {
    return reply(502, { error: error instanceof Error ? error.message : "Não foi possível conectar ao Melhor Envio agora." });
  }
}
