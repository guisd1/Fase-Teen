import { isAdmin } from "@/lib/auth";
import { consumeOAuthState, exchangeCode } from "@/lib/melhor-envio";

export const dynamic = "force-dynamic";

const back = (request: Request, status: string) =>
  Response.redirect(new URL(`/admin/integracoes?melhorenvio=${encodeURIComponent(status)}`, request.url), 302);

export async function GET(request: Request) {
  if (!(await isAdmin())) return new Response("Acesso restrito ao administrador.", { status: 401 });
  const query = new URL(request.url).searchParams;
  const code = query.get("code");
  const state = query.get("state");
  const error = query.get("error");

  if (error) return back(request, `Autorização cancelada: ${query.get("error_description") || error}`);
  if (!code || !state) return back(request, "Callback inválido: faltou code ou state.");

  try {
    if (!(await consumeOAuthState(state))) return back(request, "Autorização expirada. Tente de novo.");
    await exchangeCode(code);
    return back(request, "ok");
  } catch (err) {
    return back(request, err instanceof Error ? err.message : "Erro desconhecido.");
  }
}
