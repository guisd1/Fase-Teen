import { getProducts } from "@/db/products";
import { saveCartSnapshot } from "@/db/recovery";
import { rateLimited } from "@/lib/redis";

export const dynamic = "force-dynamic";

const str = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);

/**
 * Carrinho abandonado: o checkout manda nome, WhatsApp e os itens assim que a
 * cliente preenche o contato. Se ela não finalizar, aparece no painel para a
 * loja chamar. Nomes e preços vêm do banco, nunca do navegador.
 */
export async function POST(request: Request) {
  if (await rateLimited(request, "carrinho", 30, 60 * 60)) return new Response(null, { status: 204 });
  const body = await request.json().catch(() => null);
  const name = str(body?.name, 80);
  const phone = str(body?.phone, 40);
  const email = str(body?.email, 120) || null;
  if (!name || phone.replace(/\D/g, "").length < 10 || !Array.isArray(body?.items)) return new Response(null, { status: 400 });

  const catalog = new Map((await getProducts()).map(p => [p.id, p]));
  const items = (body.items as unknown[]).slice(0, 30).flatMap(raw => {
    const i = raw as { id?: unknown; size?: unknown; color?: unknown; qty?: unknown };
    const p = catalog.get(Number(i.id));
    const qty = Math.min(20, Math.max(1, Math.floor(Number(i.qty) || 1)));
    return p ? [{ productId: p.id, name: p.name, size: str(i.size, 20), color: str(i.color, 40), qty, price: p.price }] : [];
  });
  if (!items.length) return new Response(null, { status: 204 });
  const subtotal = Math.round(items.reduce((s, i) => s + i.price * i.qty, 0) * 100) / 100;
  await saveCartSnapshot({ name, phone, email, items, subtotal }).catch(error => console.error("Carrinho abandonado:", error));
  return new Response(null, { status: 204 });
}
