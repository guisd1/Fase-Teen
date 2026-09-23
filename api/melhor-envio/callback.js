import { consumeOAuthState, exchangeCode } from "./_common.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).send("Método não permitido.");

  const { code, state, error, error_description: errorDescription } = req.query || {};
  if (error) {
    return res.status(400).send(`Autorização cancelada: ${errorDescription || error}`);
  }
  if (!code || !state) {
    return res.status(400).send("Callback inválido: faltou code ou state.");
  }

  try {
    const validState = await consumeOAuthState(state);
    if (!validState) return res.status(400).send("State inválido ou expirado. Inicie a autorização novamente.");

    await exchangeCode(code);

    res.writeHead(302, {
      Location: "/?melhorenvio=connected",
      "Cache-Control": "no-store"
    });
    return res.end();
  } catch (error) {
    return res.status(500).send(`Não foi possível concluir a autorização: ${error?.message || "erro desconhecido"}`);
  }
}
