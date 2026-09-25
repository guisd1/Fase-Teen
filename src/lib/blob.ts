import { issueSignedToken } from "@vercel/blob";
import { handleUpload, handleUploadPresigned, type HandleUploadBody, type HandleUploadPresignedBody } from "@vercel/blob/client";

/*
  O Vercel Blob tem dois jeitos de conectar ao projeto:
  - "token": stores antigos criam BLOB_READ_WRITE_TOKEN.
  - "presigned": stores novos criam BLOB_STORE_ID e autenticam pelo OIDC da
    própria Vercel (sem token guardado). O envio usa URLs pré-assinadas.
*/
export type BlobMode = "token" | "presigned" | null;

export function blobMode(): BlobMode {
  if (process.env.BLOB_READ_WRITE_TOKEN) return "token";
  if (process.env.BLOB_STORE_ID) return "presigned";
  return null;
}

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];

/**
 * Autoriza o navegador a enviar um arquivo direto para o Vercel Blob,
 * nos dois modos de conexão. Só aceita caminhos que começam com `prefix`.
 */
export async function authorizeBlobUpload(request: Request, body: unknown, rules: {
  prefix: string;
  maxBytes: number;
  allowedContentTypes?: string[];
}) {
  const mode = blobMode();
  if (!mode) throw new Error("Vercel Blob não conectado ao projeto.");
  const allowedContentTypes = rules.allowedContentTypes ?? IMAGE_TYPES;
  const checkPath = (pathname: string) => {
    if (!pathname.startsWith(rules.prefix) || pathname.includes("..")) throw new Error("Caminho de envio inválido.");
  };

  if (mode === "presigned") {
    return handleUploadPresigned({
      body: body as HandleUploadPresignedBody,
      request,
      getSignedToken: async pathname => {
        checkPath(pathname);
        return {
          token: await issueSignedToken({
            pathname,
            operations: ["put"],
            validUntil: Date.now() + 10 * 60 * 1000,
            maximumSizeInBytes: rules.maxBytes,
            allowedContentTypes
          }),
          urlOptions: { addRandomSuffix: true }
        };
      }
    });
  }

  return handleUpload({
    request,
    body: body as HandleUploadBody,
    onBeforeGenerateToken: async pathname => {
      checkPath(pathname);
      return { allowedContentTypes, maximumSizeInBytes: rules.maxBytes, addRandomSuffix: true };
    }
  });
}
