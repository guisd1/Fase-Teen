import { authorizeBlobUpload } from "@/lib/blob";
import { hasRedis, rateLimited } from "@/lib/redis";

export const dynamic = "force-dynamic";

// Fotos das avaliações: rota pública, então só imagens de até 5 MB, com limite por IP.
// Sem Redis o limite não funciona, e o envio de fotos fica bloqueado.
export async function POST(request: Request) {
  if (!hasRedis()) return Response.json({ error: "Envio de fotos indisponível no momento." }, { status: 503 });
  if (await rateLimited(request, "review-upload", 15, 60 * 60, true)) {
    return Response.json({ error: "Muitas fotos em pouco tempo. Tente mais tarde." }, { status: 429 });
  }
  const body = await request.json();
  try {
    return Response.json(await authorizeBlobUpload(request, body, { prefix: "avaliacoes/", maxBytes: 5 * 1024 * 1024 }));
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Falha no envio." }, { status: 400 });
  }
}
