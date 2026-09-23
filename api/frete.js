import { products } from "../catalog.mjs";

const ME_URL = "https://melhorenvio.com.br";

const cleanCep = (value) => String(value || "").replace(/\D/g, "").slice(0, 8);

function reply(res, status, body) {
  return res.status(status).setHeader("Cache-Control", "no-store").json(body);
}

function normalizeQuotes(payload) {
  const list = Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : []);
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

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return reply(res, 405, { error: "Método não permitido." });

  const token = process.env.MELHOR_ENVIO_TOKEN;
  const origin = cleanCep(process.env.STORE_ORIGIN_POSTAL_CODE);
  const userAgent = process.env.MELHOR_ENVIO_USER_AGENT || "Fase Teen (contato tecnico)";
  const services = String(process.env.MELHOR_ENVIO_SERVICES || "").trim();

  if (!token) return reply(res, 500, { error: "Frete ainda não configurado: MELHOR_ENVIO_TOKEN ausente." });
  if (origin.length !== 8) return reply(res, 500, { error: "Frete ainda não configurado: STORE_ORIGIN_POSTAL_CODE ausente ou inválido." });

  const destination = cleanCep(req.body?.postalCode);
  const items = req.body?.items;
  if (destination.length !== 8) return reply(res, 400, { error: "CEP de destino inválido." });
  if (!Array.isArray(items) || !items.length) return reply(res, 400, { error: "Carrinho vazio." });

  const payloadProducts = [];
  for (const item of items) {
    const product = products.find(p => p.id === Number(item?.id));
    const quantity = Math.max(1, Math.min(50, Number(item?.quantity) || 1));
    if (!product) return reply(res, 400, { error: `Produto ${item?.id} não encontrado.` });
    const s = product.shipping;
    if (!s || ![s.weight, s.height, s.width, s.length].every(Number.isFinite)) {
      return reply(res, 500, { error: `O produto "${product.name}" está sem peso/dimensões de frete.` });
    }
    payloadProducts.push({
      id: String(product.id),
      width: Number(s.width), height: Number(s.height), length: Number(s.length),
      weight: Number(s.weight), insurance_value: Number(product.price.toFixed(2)), quantity
    });
  }

  const payload = {
    from: { postal_code: origin },
    to: { postal_code: destination },
    products: payloadProducts,
    options: { receipt: false, own_hand: false }
  };
  if (services) payload.services = services;

  try {
    const r = await fetch(`${ME_URL}/api/v2/me/shipment/calculate`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
        "Content-Type": "application/json",
        "User-Agent": userAgent
      },
      body: JSON.stringify(payload)
    });

    const data = await r.json().catch(() => ({}));
    if (r.status === 401) {
      return reply(res, 502, { error: "O token do Melhor Envio foi recusado ou expirou. Atualize MELHOR_ENVIO_TOKEN na Vercel." });
    }
    if (!r.ok) {
      return reply(res, 502, { error: data?.message || data?.error || "O Melhor Envio recusou a cotação." });
    }

    return reply(res, 200, { options: normalizeQuotes(data), postalCode: destination });
  } catch {
    return reply(res, 502, { error: "Não foi possível conectar ao Melhor Envio agora. Tente novamente." });
  }
}
