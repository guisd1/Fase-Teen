import { isAdmin } from "@/lib/auth";
import { consumeYoutubeState, exchangeYoutubeCode } from "@/lib/youtube";

export const dynamic = "force-dynamic";

const back = (request: Request, status: string) =>
  Response.redirect(new URL(`/admin/integracoes?youtube=${encodeURIComponent(status)}`, request.url), 302);

export async function GET(request: Request) {
  if (!(await isAdmin())) return new Response("Acesso restrito ao administrador.", { status: 401 });
  const query = new URL(request.url).searchParams;
  const code = query.get("code");
  const state = query.get("state");
  if (query.get("error")) return back(request, `Autorização cancelada: ${query.get("error")}`);
  if (!code || !state) return back(request, "Callback inválido: faltou code ou state.");

  try {
    if (!(await consumeYoutubeState(state))) return back(request, "Autorização expirada. Tente de novo.");
    await exchangeYoutubeCode(code);
    return back(request, "ok");
  } catch (error) {
    return back(request, error instanceof Error ? error.message : "Erro desconhecido.");
  }
}
