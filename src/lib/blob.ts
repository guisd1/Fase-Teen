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
