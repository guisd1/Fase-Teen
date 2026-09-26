import { isAdmin } from "@/lib/auth";
import { authorizeBlobUpload } from "@/lib/blob";

export const dynamic = "force-dynamic";

// Autoriza o navegador do administrador a enviar fotos (produtos e página inicial) direto para o Vercel Blob.
export async function POST(request: Request) {
  if (!(await isAdmin())) return Response.json({ error: "Acesso restrito ao administrador." }, { status: 401 });
  const body = await request.json();
  try {
    return Response.json(await authorizeBlobUpload(request, body, { prefix: ["produtos/", "inicio/"], maxBytes: 10 * 1024 * 1024 }));
  } catch (error) {
    console.error("Falha ao autorizar envio para o Blob:", error);
    return Response.json({ error: error instanceof Error ? error.message : "Falha no envio." }, { status: 400 });
  }
}
