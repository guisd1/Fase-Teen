const BREVO_URL = "https://api.brevo.com/v3/contacts";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function reply(res, status, body) {
  return res.status(status).setHeader("Cache-Control", "no-store").json(body);
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return reply(res, 405, { error: "Método não permitido." });

  const apiKey = process.env.BREVO_API_KEY;
  const listId = Number(process.env.BREVO_LIST_ID);
  if (!apiKey) return reply(res, 500, { error: "Newsletter ainda não configurada: BREVO_API_KEY ausente." });
  if (!Number.isFinite(listId)) return reply(res, 500, { error: "Newsletter ainda não configurada: BREVO_LIST_ID ausente ou inválido." });

  const email = String(req.body?.email || "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return reply(res, 400, { error: "Digite um e-mail válido." });

  try {
    const response = await fetch(BREVO_URL, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, listIds: [listId], updateEnabled: true })
    });

    // updateEnabled:true faz o Brevo atualizar o contato em vez de dar erro
    // quando o e-mail já existe, então status normal é 201 (criado) ou 204 (atualizado).
    if (response.ok || response.status === 204) {
      return reply(res, 200, { ok: true });
    }

    const data = await response.json().catch(() => ({}));
    return reply(res, 502, { error: data?.message || "O Brevo recusou o cadastro." });
  } catch (error) {
    return reply(res, 502, { error: error?.message || "Não foi possível conectar à Brevo agora." });
  }
}
