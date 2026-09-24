import { isAdmin } from "@/lib/auth";
import { setThumbnail } from "@/lib/youtube";

export const dynamic = "force-dynamic";

const reply = (status: number, body: unknown) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  if (!(await isAdmin())) return reply(401, { error: "Acesso restrito ao administrador." });
  const form = await request.formData().catch(() => null);
  const videoId = String(form?.get("videoId") || "");
  const image = form?.get("image");
  if (!/^[\w-]{11}$/.test(videoId)) return reply(400, { error: "Vídeo inválido." });
  if (!(image instanceof Blob) || !image.type.startsWith("image/")) return reply(400, { error: "Escolha uma imagem para a capa." });
  if (image.size > 2 * 1024 * 1024) return reply(400, { error: "A capa precisa ter no máximo 2 MB (regra do YouTube)." });

  try {
    await setThumbnail(videoId, image);
    return reply(200, { ok: true });
  } catch (error) {
    return reply(502, { error: error instanceof Error ? error.message : "Não foi possível enviar a capa." });
  }
}
