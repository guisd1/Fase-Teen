import { isAdmin } from "@/lib/auth";
import { createOAuthState, getClientId, getRedirectUri } from "@/lib/melhor-envio";

export const dynamic = "force-dynamic";

export async function GET() {
  // Só o administrador pode vincular a conta do Melhor Envio à loja.
  if (!(await isAdmin())) return new Response("Acesso restrito ao administrador. Entre em /admin primeiro.", { status: 401 });
  try {
    const clientId = getClientId();
    if (!clientId) return new Response("MELHOR_ENVIO_CLIENT_ID não configurado na Vercel.", { status: 500 });

    const state = await createOAuthState();
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: getRedirectUri(),
      response_type: "code",
      state,
      scope: "shipping-calculate"
    });

    return new Response(null, {
      status: 302,
      headers: { Location: `https://melhorenvio.com.br/oauth/authorize?${params}`, "Cache-Control": "no-store" }
    });
  } catch (error) {
    return new Response(error instanceof Error ? error.message : "Não foi possível iniciar a autorização.", { status: 500 });
  }
}
