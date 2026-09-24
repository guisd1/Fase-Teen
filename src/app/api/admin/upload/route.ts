import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Autoriza o navegador do administrador a enviar fotos direto para o Vercel Blob.
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const result = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async () => {
        if (!(await isAdmin())) throw new Error("Acesso restrito ao administrador.");
        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"],
          maximumSizeInBytes: 10 * 1024 * 1024,
          addRandomSuffix: true
        };
      }
    });
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Falha no envio." }, { status: 400 });
  }
}
