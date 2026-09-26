import type { ReactNode } from "react";
import Link from "next/link";
import { getStore } from "@/stores";
import { requireAdmin } from "@/lib/auth";
import { adminCountOrders } from "@/db/orders";
import { adminCountPendingReviews } from "@/db/reviews";
import { logout } from "../actions";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: ReactNode }) {
  await requireAdmin();
  const store = getStore();
  const [pending, pendingReviews] = await Promise.all([
    adminCountOrders("pendente").catch(() => 0),
    adminCountPendingReviews().catch(() => 0)
  ]);
  return (
    <div className="admin-shell">
      <aside className="admin-side">
        <div className="admin-brand">
          <strong>{store.name}</strong>
          <small>Painel</small>
        </div>
        <nav>
          <Link href="/admin">Resumo</Link>
          <Link href="/admin/produtos">Produtos</Link>
          <Link href="/admin/estoque">Estoque</Link>
          <Link href="/admin/inicio">Página inicial</Link>
          <Link href="/admin/integracoes">Integrações</Link>
          <Link href="/admin/pedidos">Pedidos {pending > 0 && <em className="admin-badge">{pending}</em>}</Link>
          <Link href="/admin/cupons">Cupons</Link>
          <Link href="/admin/relatorio">Relatório</Link>
          <Link href="/admin/clientes">Clientes</Link>
          <Link href="/admin/avaliacoes">Avaliações {pendingReviews > 0 && <em className="admin-badge">{pendingReviews}</em>}</Link>
        </nav>
        <div className="admin-side-foot">
          <a href="/" target="_blank" rel="noopener">Ver loja ↗</a>
          <form action={logout}><button type="submit">Sair</button></form>
        </div>
      </aside>
      <div className="admin-main">{children}</div>
    </div>
  );
}
