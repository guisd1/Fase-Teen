import Link from "next/link";
import { adminListOrders } from "@/db/orders";
import { ORDER_STATUSES, STATUS_LABELS, isOrderStatus } from "@/lib/order-status";
import { money } from "@/lib/format";

const dateTime = (d: Date) => d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const query = await searchParams;
  const filter = isOrderStatus(query.status) ? query.status : null;
  const all = await adminListOrders();
  const orders = filter ? all.filter(o => o.status === filter) : all;
  const count = (s: (typeof ORDER_STATUSES)[number]) => all.filter(o => o.status === s).length;

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Pedidos</h1>
          <p>Registrados quando o cliente envia o pedido pelo WhatsApp. O estoque é baixado ao confirmar o pedido.</p>
        </div>
      </div>

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
          <p>{filter ? "Nenhum pedido com este status." : "Nenhum pedido ainda. Eles aparecem aqui quando um cliente finaliza a compra pelo site."}</p>
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
                  <td><Link href={`/admin/pedidos/${o.id}`}><strong>#{o.id}</strong></Link><small>{dateTime(o.createdAt)}</small></td>
                  <td><Link href={`/admin/pedidos/${o.id}`}><strong>{o.customerName}</strong></Link><small>{o.customerPhone}</small></td>
                  <td>{o.items.reduce((s, i) => s + i.qty, 0)} un.<small>{o.items.map(i => i.name).join(", ").slice(0, 60)}</small></td>
                  <td>{money(o.total)}</td>
                  <td>{o.deliveryMode === "pickup" ? "Retirada" : `${o.address?.city ?? ""}/${o.address?.state ?? ""}`}</td>
                  <td><span className={`admin-status status-${o.status}`}>{STATUS_LABELS[o.status]}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
