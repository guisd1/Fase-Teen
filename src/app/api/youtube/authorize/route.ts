import { isAdmin } from "@/lib/auth";
import { youtubeAuthorizeUrl, youtubeConfigured } from "@/lib/youtube";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) return new Response("Acesso restrito ao administrador.", { status: 401 });
  if (!youtubeConfigured()) return new Response("GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET não configurados na Vercel.", { status: 500 });
  try {
    return Response.redirect(await youtubeAuthorizeUrl(), 302);
  } catch (error) {
    return new Response(error instanceof Error ? error.message : "Não foi possível iniciar a autorização.", { status: 500 });
  }
}
