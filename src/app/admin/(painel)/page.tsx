import Link from "next/link";
import { adminSummary, type PeriodSummary } from "@/db/insights";
import { adminCountPendingReviews } from "@/db/reviews";
import { money } from "@/lib/format";
import InfoTip from "@/components/admin/InfoTip";

const PROFIT_HINT = "Estimativa: o total dos pedidos confirmados, menos a taxa do Mercado Pago, menos o frete pago à transportadora, menos o custo das peças cadastrado em cada produto. Pedidos combinados pelo WhatsApp entram sem taxa.";

function Period({ title, data }: { title: string; data: PeriodSummary }) {
  return (
    <div className="admin-card summary-period">
      <h2>{title}</h2>
      <div className="summary-numbers">
        <div><small>Vendas</small><strong>{money(data.revenue)}</strong></div>
        <div><small>Pedidos</small><strong>{data.orders}</strong></div>
        <div>
          <small>Ticket médio <InfoTip label="Ticket médio" text="Quanto cada cliente gastou, em média, por pedido confirmado (com frete)." /></small>
          <strong>{data.orders ? money(data.ticket) : "–"}</strong>
        </div>
        <div>
          <small>Lucro estimado <InfoTip label="Lucro estimado" text={PROFIT_HINT} /></small>
          <strong>{money(data.profit)}</strong>
        </div>
      </div>
      {data.missingCost && <p className="admin-hint">Algum produto vendido não tem custo cadastrado: o lucro está maior do que o real.</p>}
    </div>
  );
}

export default async function SummaryPage() {
  const [s, reviews] = await Promise.all([adminSummary(), adminCountPendingReviews().catch(() => 0)]);
  const tasks = [
    s.pending > 0 && { href: "/admin/pedidos?status=pendente", text: `${s.pending} pedido(s) aguardando confirmação` },
    s.toShip > 0 && { href: "/admin/pedidos?status=preparacao", text: `${s.toShip} pedido(s) em preparação para enviar` },
    reviews > 0 && { href: "/admin/avaliacoes", text: `${reviews} avaliação(ões) esperando aprovação` }
  ].filter(Boolean) as { href: string; text: string }[];

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Resumo</h1>
          <p>Como está a loja hoje. Vendas contam só pedidos confirmados (em preparação, enviados ou entregues).</p>
        </div>
      </div>

      {tasks.length > 0 && (
        <div className="admin-card summary-tasks">
          <h2>Para fazer</h2>
          <ul>{tasks.map(t => <li key={t.href}><Link href={t.href}>{t.text} →</Link></li>)}</ul>
        </div>
      )}

      <div className="summary-periods">
        <Period title="Hoje" data={s.today} />
        <Period title="Últimos 7 dias" data={s.week} />
        <Period title="Este mês" data={s.month} />
      </div>

      <div className="admin-grid-2">
        <div className="admin-card">
          <h2>Mais vendidos <small>últimos 30 dias</small></h2>
          {s.topProducts.length === 0 ? <p className="admin-hint">Nenhuma venda confirmada nos últimos 30 dias.</p> : (
            <ol className="summary-list">
              {s.topProducts.map(p => (
                <li key={p.productId}><span>{p.name}</span><strong>{p.qty} un.</strong><small>{money(p.revenue)}</small></li>
              ))}
            </ol>
          )}
          <p><Link href="/admin/relatorio">Ver relatório completo →</Link></p>
        </div>
        <div className="admin-card">
          <h2>Estoque baixo <small>2 peças ou menos</small></h2>
          {s.lowStock.length === 0 ? <p className="admin-hint">Tudo com estoque. Nenhum tamanho com 2 peças ou menos.</p> : (
            <ul className="summary-list">
              {s.lowStock.slice(0, 12).map(p => (
                <li key={`${p.id}-${p.size}`}>
                  <span>{p.name} <small>tam. {p.size}</small></span>
                  <strong className={p.stock === 0 ? "admin-error" : ""}>{p.stock === 0 ? "esgotado" : `${p.stock} un.`}</strong>
                </li>
              ))}
            </ul>
          )}
          <p><Link href="/admin/estoque">Editar estoque →</Link></p>
        </div>
      </div>
    </>
  );
}
