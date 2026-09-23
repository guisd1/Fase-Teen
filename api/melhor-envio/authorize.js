import { createOAuthState, getClientId, getRedirectUri } from "./_common.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).send("Método não permitido.");

  try {
    const clientId = getClientId();
    if (!clientId) return res.status(500).send("MELHOR_ENVIO_CLIENT_ID não configurado na Vercel.");

    const state = await createOAuthState();
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: getRedirectUri(),
      response_type: "code",
      state,
      scope: "shipping-calculate"
    });

    res.writeHead(302, {
      Location: `https://melhorenvio.com.br/oauth/authorize?${params.toString()}`,
      "Cache-Control": "no-store"
    });
    return res.end();
  } catch (error) {
    return res.status(500).send(error?.message || "Não foi possível iniciar a autorização.");
  }
}
