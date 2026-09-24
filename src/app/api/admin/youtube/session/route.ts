import { isAdmin } from "@/lib/auth";
import { createUploadSession } from "@/lib/youtube";

export const dynamic = "force-dynamic";

const reply = (status: number, body: unknown) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

// Cria a sessão de upload; o navegador envia o vídeo direto para o YouTube.
export async function POST(request: Request) {
  if (!(await isAdmin())) return reply(401, { error: "Acesso restrito ao administrador." });
  const body = await request.json().catch(() => ({}));

  const title = String(body.title || "").trim().slice(0, 100);
  const size = Number(body.size);
  const mimeType = String(body.mimeType || "");
  if (!title) return reply(400, { error: "Informe o título do vídeo." });
  if (!Number.isFinite(size) || size <= 0) return reply(400, { error: "Arquivo de vídeo inválido." });
  if (!mimeType.startsWith("video/")) return reply(400, { error: "O arquivo precisa ser um vídeo." });

  const tags: string[] = (Array.isArray(body.tags) ? body.tags : [])
    .map((t: unknown) => String(t).replace(/^#/, "").trim())
    .filter(Boolean)
    .slice(0, 30);
  const hashtags = tags.map(t => `#${t.replace(/\s+/g, "")}`).join(" ");
  const description = [String(body.description || "").trim(), hashtags].filter(Boolean).join("\n\n").slice(0, 5000);
  const privacy = ["public", "unlisted", "private"].includes(body.privacy) ? body.privacy : "public";

  try {
    const uploadUrl = await createUploadSession(
      { title, description, tags, privacy, madeForKids: Boolean(body.madeForKids), size, mimeType },
      new URL(request.url).origin
    );
    return reply(200, { uploadUrl });
  } catch (error) {
    return reply(502, { error: error instanceof Error ? error.message : "Não foi possível iniciar o envio." });
  }
}
