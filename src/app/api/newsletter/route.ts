const BREVO_URL = "https://api.brevo.com/v3/contacts";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const dynamic = "force-dynamic";

const reply = (status: number, body: unknown) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  const apiKey = process.env.BREVO_API_KEY;
  const listId = Number(process.env.BREVO_LIST_ID);
  if (!apiKey) return reply(500, { error: "Newsletter ainda não configurada: BREVO_API_KEY ausente." });
  if (!Number.isFinite(listId)) return reply(500, { error: "Newsletter ainda não configurada: BREVO_LIST_ID ausente ou inválido." });

  const body = await request.json().catch(() => ({}));
  const email = String(body?.email || "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return reply(400, { error: "Digite um e-mail válido." });

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
    if (response.ok) return reply(200, { ok: true });

    const data = await response.json().catch(() => ({}));
    return reply(502, { error: data?.message || "O Brevo recusou o cadastro." });
  } catch (error) {
    return reply(502, { error: error instanceof Error ? error.message : "Não foi possível conectar à Brevo agora." });
  }
}
