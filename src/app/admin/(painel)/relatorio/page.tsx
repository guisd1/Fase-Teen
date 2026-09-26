import Link from "next/link";
import { adminProductReport, todayBR, type ProductReportRow } from "@/db/stats";
import { productSlug } from "@/db/products";
import { money } from "@/lib/format";

const PERIODS = [
  { key: "hoje", label: "Hoje", days: 1 },
  { key: "7", label: "7 dias", days: 7 },
  { key: "30", label: "30 dias", days: 30 },
  { key: "90", label: "90 dias", days: 90 },
  { key: "tudo", label: "Tudo", days: null }
] as const;

const COLUMNS = [
  { key: "views", label: "Visualizações", hint: "Vezes que a página do produto foi aberta (uma por visita)" },
  { key: "clicks", label: "Cliques na vitrine", hint: "Cliques no produto na página inicial" },
  { key: "carts", label: "No carrinho", hint: "Cliques em Adicionar ao carrinho" },
  { key: "sold", label: "Vendidos", hint: "Peças em pedidos confirmados (em preparação, enviados ou entregues)" },
  { key: "revenue", label: "Faturado", hint: "Valor das peças vendidas, sem frete" }
] as const;
type SortKey = (typeof COLUMNS)[number]["key"];

/** Primeiro dia do período (AAAA-MM-DD, horário de Brasília). */
function fromDay(days: number | null) {
  if (days === null) return null;
  const d = new Date(`${todayBR()}T12:00:00-03:00`);
  d.setDate(d.getDate() - (days - 1));
  return d.toISOString().slice(0, 10);
}

const pct = (a: number, b: number) => (b > 0 ? `${Math.round((a / b) * 1000) / 10}%`.replace(".", ",") : "–");

export default async function ReportPage({ searchParams }: { searchParams: Promise<{ periodo?: string; ordem?: string }> }) {
  const query = await searchParams;
  const period = PERIODS.find(p => p.key === query.periodo) ?? PERIODS[2];
  const sort: SortKey = COLUMNS.some(c => c.key === query.ordem) ? (query.ordem as SortKey) : "views";
  const rows = (await adminProductReport(fromDay(period.days))).sort((a, b) => b[sort] - a[sort] || b.views - a.views);
  const total = (k: keyof ProductReportRow) => rows.reduce((sum, r) => sum + (r[k] as number), 0);
  const link = (p: string, o: string) => `/admin/relatorio?periodo=${p}&ordem=${o}`;
  const fmt = (k: SortKey, v: number) => (k === "revenue" ? money(v) : v.toLocaleString("pt-BR"));

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Relatório de produtos</h1>
          <p>Quais peças chamam mais atenção e quais vendem. Clique no nome de uma coluna para ordenar.</p>
        </div>
      </div>

      <div className="admin-tabs">
        {PERIODS.map(p => <Link key={p.key} className={p.key === period.key ? "active" : ""} href={link(p.key, sort)}>{p.label}</Link>)}
      </div>

      <div className="admin-report-totals">
        {COLUMNS.map(c => (
          <div key={c.key}><small>{c.label}</small><strong>{fmt(c.key, total(c.key))}</strong></div>
        ))}
        <div><small>Visualização → carrinho</small><strong>{pct(total("carts"), total("views"))}</strong></div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table admin-report">
          <thead>
            <tr>
              <th>Produto</th>
              {COLUMNS.map(c => (
                <th key={c.key} title={c.hint}>
                  <Link className={sort === c.key ? "active" : ""} href={link(period.key, c.key)}>{c.label}{sort === c.key ? " ↓" : ""}</Link>
                </th>
              ))}
              <th title="Quantos dos que viram o produto colocaram no carrinho">Viu → carrinho</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className={r.active ? "" : "admin-muted"}>
                <td>
                  <div className="admin-report-product">
                    {r.image ? <img src={r.image} alt="" /> : <span />}
                    <div>
                      <a href={`/produto/${productSlug(r)}`} target="_blank" rel="noopener"><strong>{r.name}</strong></a>
                      <small>{[r.reference, !r.active && "inativo"].filter(Boolean).join(" • ")}</small>
                    </div>
                  </div>
                </td>
                {COLUMNS.map(c => <td key={c.key}>{fmt(c.key, r[c.key])}</td>)}
                <td>{pct(r.carts, r.views)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="admin-hint">
        Os números começam a contar a partir de hoje. Visitas de robôs (Google etc.) não entram, e recarregar a mesma página
        não conta duas vezes. Nada de quem visitou é guardado, só os totais.
      </p>
    </>
  );
}
