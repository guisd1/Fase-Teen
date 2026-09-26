import Link from "next/link";
import { adminListOrders } from "@/db/orders";
import { ORDER_STATUSES, STATUS_LABELS, isOrderStatus } from "@/lib/order-status";
import { money } from "@/lib/format";
import { paymentSummary } from "@/lib/payment-labels";

const dateTime = (d: Date) => d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });

const normalize = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const query = await searchParams;
  const filter = isOrderStatus(query.status) ? query.status : null;
  const search = normalize(query.q?.trim() ?? "");
  const all = await adminListOrders();
  // Busca pelo número do pedido, nome ou telefone do cliente.
  const orders = all.filter(o =>
    (!filter || o.status === filter) &&
    (!search || o.code.includes(search) || normalize(o.customerName).includes(search) ||
      (search.replace(/\D/g, "") && o.customerPhone.replace(/\D/g, "").includes(search.replace(/\D/g, "")))));
  const count = (s: (typeof ORDER_STATUSES)[number]) => all.filter(o => o.status === s).length;

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Pedidos</h1>
          <p>Registrados quando o cliente envia o pedido pelo WhatsApp. O estoque é baixado ao confirmar o pedido.</p>
        </div>
        <a className="btn btn-light" href="/admin/exportar/pedidos">Baixar planilha (Excel)</a>
      </div>

      <form className="admin-search" action="/admin/pedidos">
        {filter && <input type="hidden" name="status" value={filter} />}
        <input name="q" type="search" defaultValue={query.q ?? ""} placeholder="Buscar por nº do pedido, nome ou telefone" />
        <button className="btn btn-dark" type="submit">Buscar</button>
      </form>

      <div className="admin-tabs">
        <Link className={!filter ? "active" : ""} href="/admin/pedidos">Todos <em>{all.length}</em></Link>
        {ORDER_STATUSES.map(s => (
          <Link key={s} className={filter === s ? "active" : ""} href={`/admin/pedidos?status=${s}`}>
            {STATUS_LABELS[s]} <em>{count(s)}</em>
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="admin-empty">
          <p>{search ? "Nenhum pedido encontrado nesta busca." : filter ? "Nenhum pedido com este status." :"Nenhum pedido ainda. Eles aparecem aqui quando um cliente finaliza a compra pelo site."}</p>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Nº</th><th>Cliente</th><th>Itens</th><th>Total</th><th>Entrega</th><th>Status</th></tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id}>
                  <td><Link href={`/admin/pedidos/${o.id}`}><strong>nº {o.code}</strong></Link><small>{dateTime(o.createdAt)}</small></td>
                  <td><Link href={`/admin/pedidos/${o.id}`}><strong>{o.customerName}</strong></Link><small>{o.customerPhone}</small></td>
                  <td>{o.items.reduce((s, i) => s + i.qty, 0)} un.<small>{o.items.map(i => i.name).join(", ").slice(0, 60)}</small></td>
                  <td>{money(o.total)}</td>
                  <td>{o.deliveryMode === "pickup" ? "Retirada" : `${o.address?.city ?? ""}/${o.address?.state ?? ""}`}</td>
                  <td>
                    <span className={`admin-status status-${o.status}`}>{STATUS_LABELS[o.status]}</span>
                    {o.paymentMethod !== "whatsapp" && <small className={paymentSummary(o).ok ? "admin-paid" : ""}>{o.paymentMethod === "pix" ? "Pix" : "Cartão"}: {paymentSummary(o).label}</small>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
