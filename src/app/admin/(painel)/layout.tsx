import type { ReactNode } from "react";
import Link from "next/link";
import { getStore } from "@/stores";
import { requireAdmin } from "@/lib/auth";
import { logout } from "../actions";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: ReactNode }) {
  await requireAdmin();
  const store = getStore();
  return (
    <div className="admin-shell">
      <aside className="admin-side">
        <div className="admin-brand">
          <strong>{store.name}</strong>
          <small>Painel</small>
        </div>
        <nav>
          <Link href="/admin/produtos">📦 Produtos</Link>
          <Link href="/admin/integracoes">🔌 Integrações</Link>
          <span className="admin-soon">🧾 Pedidos <em>em breve</em></span>
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
