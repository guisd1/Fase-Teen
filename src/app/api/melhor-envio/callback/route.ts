import { consumeOAuthState, exchangeCode } from "@/lib/melhor-envio";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  const code = query.get("code");
  const state = query.get("state");
  const error = query.get("error");

  if (error) {
    return new Response(`Autorização cancelada: ${query.get("error_description") || error}`, { status: 400 });
  }
  if (!code || !state) {
    return new Response("Callback inválido: faltou code ou state.", { status: 400 });
  }

  try {
    const validState = await consumeOAuthState(state);
    if (!validState) return new Response("State inválido ou expirado. Inicie a autorização novamente.", { status: 400 });

    await exchangeCode(code);

    return new Response(null, { status: 302, headers: { Location: "/?melhorenvio=connected", "Cache-Control": "no-store" } });
  } catch (err) {
    return new Response(`Não foi possível concluir a autorização: ${err instanceof Error ? err.message : "erro desconhecido"}`, { status: 500 });
  }
}
