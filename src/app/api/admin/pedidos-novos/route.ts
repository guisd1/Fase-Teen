import { desc } from "drizzle-orm";
import { isAdmin } from "@/lib/auth";
import { getDb, hasDatabase } from "@/db/client";
import { orders } from "@/db/schema";

export const dynamic = "force-dynamic";

/** Último pedido (para o aviso de pedido novo no painel). */
export async function GET() {
  if (!(await isAdmin())) return new Response(null, { status: 401 });
  if (!hasDatabase()) return Response.json({ latest: null });
  const [row] = await getDb().select({ id: orders.id, code: orders.code, name: orders.customerName, total: orders.total })
    .from(orders).orderBy(desc(orders.id)).limit(1);
  return Response.json({ latest: row ?? null }, { headers: { "Cache-Control": "no-store" } });
}
