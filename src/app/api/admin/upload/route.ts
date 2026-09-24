import { issueSignedToken } from "@vercel/blob";
import { handleUpload, handleUploadPresigned, type HandleUploadBody, type HandleUploadPresignedBody } from "@vercel/blob/client";
import { isAdmin } from "@/lib/auth";
import { blobMode } from "@/lib/blob";

export const dynamic = "force-dynamic";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];
const MAX_BYTES = 10 * 1024 * 1024;

// Autoriza o navegador do administrador a enviar fotos direto para o Vercel Blob.
export async function POST(request: Request) {
  if (!(await isAdmin())) return Response.json({ error: "Acesso restrito ao administrador." }, { status: 401 });
  const mode = blobMode();
  if (!mode) return Response.json({ error: "Vercel Blob não conectado ao projeto." }, { status: 500 });

  const body = await request.json();
  try {
    if (mode === "presigned") {
      const result = await handleUploadPresigned({
        body: body as HandleUploadPresignedBody,
        request,
        getSignedToken: async pathname => ({
          token: await issueSignedToken({
            pathname,
            operations: ["put"],
            validUntil: Date.now() + 10 * 60 * 1000,
            maximumSizeInBytes: MAX_BYTES,
            allowedContentTypes: ALLOWED
          }),
          urlOptions: { addRandomSuffix: true }
        })
      });
      return Response.json(result);
    }

    const result = await handleUpload({
      request,
      body: body as HandleUploadBody,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ALLOWED,
        maximumSizeInBytes: MAX_BYTES,
        addRandomSuffix: true
      })
    });
    return Response.json(result);
  } catch (error) {
    console.error("Falha ao autorizar envio para o Blob:", error);
    return Response.json({ error: error instanceof Error ? error.message : "Falha no envio." }, { status: 400 });
  }
}
