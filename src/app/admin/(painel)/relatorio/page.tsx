import Link from "next/link";
import { adminDailyStats, adminProductReport, adminTrafficReport, todayBR, type ProductReportRow } from "@/db/stats";
import ReportDashboard from "@/components/admin/ReportDashboard";
import { SOURCE_LABELS } from "@/lib/traffic-source";
import { productSlug } from "@/db/products";
import { money } from "@/lib/format";
import InfoTip from "@/components/admin/InfoTip";

const PERIODS = [
  { key: "hoje", label: "Hoje", days: 1 },
  { key: "7", label: "7 dias", days: 7 },
  { key: "30", label: "30 dias", days: 30 },
  { key: "90", label: "90 dias", days: 90 },
  { key: "tudo", label: "Tudo", days: null }
] as const;

const COLUMNS = [
  { key: "views", label: "Visualizações", hint: "Quantas vezes a página do produto foi aberta. Cada pessoa conta uma vez por visita: recarregar a página ou voltar nela no mesmo acesso não soma de novo. Robôs, como o do Google, não entram." },
  { key: "clicks", label: "Cliques na vitrine", hint: "Quantas vezes clicaram no produto na página inicial (na foto, no nome ou em Ver produto). Mostra quais peças chamam atenção de quem está olhando a loja." },
  { key: "carts", label: "No carrinho", hint: "Quantas vezes clicaram em Adicionar ao carrinho na página do produto. Conta mesmo que a pessoa não finalize a compra, então mostra interesse real na peça." },
  { key: "shares", label: "Compartilhado", hint: "Quantas vezes alguém usou o botão Compartilhar produto e enviou ou copiou o link. Se a pessoa cancelar antes de enviar, não conta." },
  { key: "linkOpens", label: "Aberto por link", hint: "Visitas que começaram direto na página do produto, vindas de fora do site: um link recebido no WhatsApp, no Instagram, num post ou achado no Google. Quem entrou pela página inicial e navegou até o produto não conta aqui." },
  { key: "adOpens", label: "Por anúncio", hint: "Das visitas que chegaram direto no produto, quantas vieram de um anúncio (tráfego pago). Só funciona se o anúncio tiver os parâmetros de URL configurados (utm_medium=paid) ou for do Google Ads." },
  { key: "sold", label: "Vendidos", hint: "Quantidade de peças em pedidos confirmados: em preparação, enviados ou entregues. Pedidos aguardando confirmação ou cancelados não entram. Vale também para pedidos antigos." },
  { key: "revenue", label: "Faturado", hint: "Soma do valor das peças vendidas nos pedidos confirmados, pelo preço cobrado na compra. Não inclui o frete." },
  { key: "profit", label: "Lucro", hint: "Lucro estimado das peças vendidas: o valor que entrou (com os descontos de cupom e do Pix), menos a taxa do Mercado Pago, menos o frete pago pela loja no frete grátis, menos o custo da peça cadastrado no produto. Aparece um traço quando o produto não tem custo cadastrado." }
] as const;

const TRAFFIC_HINT = "Mostra de onde veio cada visita: anúncio pago (com o nome da campanha), Instagram, Facebook, Google, WhatsApp, TikTok, outros sites ou direto. Direto é quem digitou o endereço ou abriu um link sem origem, como muitos links abertos pelo app do WhatsApp.";

const CONVERSION_HINT = "De cada 100 visualizações do produto, quantas viraram Adicionar ao carrinho. Ajuda a ver se a página convence: muita visita e pouco carrinho pode indicar preço, fotos ou descrição a melhorar.";
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
  const [report, traffic, daily] = await Promise.all([
    adminProductReport(fromDay(period.days)),
    adminTrafficReport(fromDay(period.days)),
    adminDailyStats(fromDay(period.days))
  ]);
  traffic.sort((a, b) => b.visits - a.visits || b.orders - a.orders);
  const num = (v: number | null) => v ?? -1e12;
  const rows = report.sort((a, b) => num(b[sort]) - num(a[sort]) || b.views - a.views);
  const total = (k: keyof ProductReportRow) => rows.reduce((sum, r) => sum + ((r[k] as number | null) ?? 0), 0);
  const MONEY: SortKey[] = ["revenue", "profit"];
  const link = (p: string, o: string) => `/admin/relatorio?periodo=${p}&ordem=${o}`;
  const fmt = (k: SortKey, v: number | null) => (v === null ? "–" : MONEY.includes(k) ? money(v) : v.toLocaleString("pt-BR"));

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Relatório de produtos</h1>
          <p>Quais peças chamam mais atenção e quais vendem. Clique nos quadrinhos para ligar ou desligar as linhas do gráfico, e no nome de uma coluna da tabela para ordenar.</p>
        </div>
      </div>

      <div className="admin-tabs">
        {PERIODS.map(p => <Link key={p.key} className={p.key === period.key ? "active" : ""} href={link(p.key, sort)}>{p.label}</Link>)}
      </div>

      <ReportDashboard
        daily={daily}
        cards={COLUMNS.filter(c => !MONEY.includes(c.key)).map(c => ({ key: c.key, label: c.label, hint: c.hint, value: fmt(c.key, total(c.key)) }))}
        extraCards={[
          { key: "revenue", label: "Faturado", hint: COLUMNS.find(c => c.key === "revenue")!.hint + " Por ser um valor em reais, não entra no gráfico (as linhas são quantidades).", value: money(total("revenue")) },
          { key: "profit", label: "Lucro estimado", hint: COLUMNS.find(c => c.key === "profit")!.hint, value: money(total("profit")) },
          { key: "conversion", label: "Visualização → carrinho", hint: CONVERSION_HINT, value: pct(total("carts"), total("views")) }
        ]}
      />

      <div className="admin-table-wrap">
        <table className="admin-table admin-report">
          <thead>
            <tr>
              <th>Produto</th>
              {COLUMNS.map(c => (
                <th key={c.key}>
                  <Link className={sort === c.key ? "active" : ""} href={link(period.key, c.key)}>{c.label}{sort === c.key ? " ↓" : ""}</Link>
                  <InfoTip label={c.label} text={c.hint} />
                </th>
              ))}
              <th>Viu → carrinho <InfoTip label="Viu → carrinho" text={CONVERSION_HINT} /></th>
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
      <h2 className="admin-report-title">
        De onde vêm as visitas
        <InfoTip label="De onde vêm as visitas" text={TRAFFIC_HINT} />
      </h2>
      <div className="admin-table-wrap">
        <table className="admin-table admin-report admin-traffic">
          <thead>
            <tr>
              <th>Origem</th>
              <th>Campanha</th>
              <th>Visitas <InfoTip label="Visitas" text="Quantas visitas começaram por esta origem. Cada visita conta uma vez, não importa quantas páginas a pessoa abriu." /></th>
              <th>Pedidos <InfoTip label="Pedidos" text="Pedidos confirmados (em preparação, enviados ou entregues) de quem chegou por esta origem. Vale a última origem da cliente nos 30 dias antes da compra: se ela viu o anúncio e voltou depois digitando o site, o pedido conta para o anúncio." /></th>
              <th>Valor <InfoTip label="Valor" text="Soma do total desses pedidos, com frete." /></th>
              <th>Visita → pedido <InfoTip label="Visita → pedido" text="De cada 100 visitas desta origem, quantas viraram pedido confirmado. Compare anúncios entre si: o que traz mais pedidos por visita é o que vale mais o investimento." /></th>
            </tr>
          </thead>
          <tbody>
            {traffic.length === 0 && <tr><td colSpan={6} className="admin-muted">Nenhuma visita registrada neste período.</td></tr>}
            {traffic.map(t => (
              <tr key={`${t.source}|${t.campaign}`}>
                <td><strong>{SOURCE_LABELS[t.source] ?? (t.source === "sem-registro" ? "Sem registro (pedidos antigos)" : t.source)}</strong></td>
                <td>{t.campaign || "–"}</td>
                <td>{t.visits.toLocaleString("pt-BR")}</td>
                <td>{t.orders.toLocaleString("pt-BR")}</td>
                <td>{money(t.revenue)}</td>
                <td>{pct(t.orders, t.visits)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="admin-hint">
        <strong>Anúncios:</strong> para o site reconhecer o tráfego pago e o nome da campanha, no Meta Ads (Instagram e
        Facebook) abra o anúncio e, em <em>Rastreamento → Parâmetros de URL</em>, cole:{" "}
        <code>utm_source=meta&amp;utm_medium=paid&amp;utm_campaign={"{{campaign.name}}"}</code>. No Google Ads, com a
        marcação automática ligada (padrão), já funciona sozinho.
      </p>
      <p className="admin-hint">
        <strong>Aberto por link</strong> conta quem chegou direto na página do produto vindo de fora do site: um link
        recebido no WhatsApp, no Instagram, achado no Google etc. Quem navegou pela loja até o produto não entra aí.
        {" "}Os números começam a contar a partir de hoje. Visitas de robôs (Google etc.) não entram, e recarregar a mesma página
        não conta duas vezes. Nada de quem visitou é guardado, só os totais.
      </p>
    </>
  );
}
