import { isAdmin } from "@/lib/auth";
import { pushToAdmins, removeSubscription, saveSubscription, vapidKeys } from "@/lib/push";

export const dynamic = "force-dynamic";

const deny = () => new Response("Acesso restrito ao administrador.", { status: 401 });

/** Chave pública para o navegador assinar as notificações. */
export async function GET() {
  if (!(await isAdmin())) return deny();
  return Response.json({ publicKey: (await vapidKeys()).publicKey }, { headers: { "Cache-Control": "no-store" } });
}

/** Ativa este aparelho. */
export async function POST(request: Request) {
  if (!(await isAdmin())) return deny();
  const body = await request.json().catch(() => null);
  const sub = body?.subscription;
  if (typeof sub?.endpoint !== "string" || !sub.endpoint.startsWith("https://") || typeof sub?.keys?.p256dh !== "string" || typeof sub?.keys?.auth !== "string") {
    return Response.json({ error: "Assinatura inválida." }, { status: 400 });
  }
  await saveSubscription({ endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } }, String(body?.device ?? "").slice(0, 120));
  return Response.json({ ok: true });
}

/** Notificação de teste para todos os aparelhos ativados. */
export async function PUT() {
  if (!(await isAdmin())) return deny();
  await pushToAdmins({ title: "Teste de notificação", body: "Tudo certo! Os pedidos novos vão aparecer assim.", url: "/admin/pedidos", tag: "teste" });
  return Response.json({ ok: true });
}

/** Desativa este aparelho. */
export async function DELETE(request: Request) {
  if (!(await isAdmin())) return deny();
  const body = await request.json().catch(() => null);
  if (typeof body?.endpoint === "string") await removeSubscription(body.endpoint);
  return Response.json({ ok: true });
}
