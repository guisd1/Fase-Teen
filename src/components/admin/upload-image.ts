import { upload, uploadPresigned } from "@vercel/blob/client";
import type { BlobMode } from "@/lib/blob";

/** Envia uma foto do navegador direto para o Vercel Blob e devolve a URL pública. */
export async function uploadImage(file: File, folder: "produtos" | "inicio", mode: BlobMode) {
  const send = mode === "presigned" ? uploadPresigned : upload;
  try {
    const blob = await send(`${folder}/${file.name}`, file, { access: "public", handleUploadUrl: "/api/admin/upload" });
    return blob.url;
  } catch (error) {
    const raw = error instanceof Error ? error.message : "erro";
    throw new Error(/client token|presigned/i.test(raw)
      ? "o envio não foi autorizado. Confira se o Blob está conectado ao projeto na Vercel e faça o Redeploy."
      : raw);
  }
}
