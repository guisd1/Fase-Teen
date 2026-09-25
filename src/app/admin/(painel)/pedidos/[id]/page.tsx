import Link from "next/link";
import { notFound } from "next/navigation";
import { adminGetOrder } from "@/db/orders";
import { getStore } from "@/stores";
import { formatCep, money } from "@/lib/format";
import { STATUS_LABELS } from "@/lib/order-status";
import { customerWhatsapp, statusMessage, trackingUrl } from "@/lib/order-messages";
import { METHOD_LABELS, paymentSummary } from "@/lib/payment-labels";
import OrderStatusPanel from "@/components/admin/OrderStatusPanel";
import DeleteButton from "@/components/admin/DeleteButton";
import { deleteOrder, saveOrderNotes } from "../../../actions";

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const order = Number.isInteger(id) ? await adminGetOrder(id) : null;
  if (!order) notFound();
  const store = getStore();
  const phone = customerWhatsapp(order.customerPhone);
  const notifyUrl = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(statusMessage(store, order))}` : null;
  const payment = paymentSummary(order);
  const a = order.address;
  const s = order.shipping;

  return (
    <>
      <div className="admin-head">
        <div>
          <p><Link href="/admin/pedidos">← Pedidos</Link></p>
          <h1>Pedido nº {order.code}</h1>
          <p>
            {order.createdAt.toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "short", timeZone: "America/Sao_Paulo" })}
            {" • "}<span className={`admin-status status-${order.status}`}>{STATUS_LABELS[order.status]}</span>
          </p>
        </div>
        <DeleteButton
          action={deleteOrder.bind(null, order.id)}
          label="Excluir pedido"
          warning={order.stockApplied ? "Excluir? O estoque deste pedido volta para os produtos." : "Excluir este pedido de vez?"}
        />
      </div>

      <OrderStatusPanel id={order.id} status={order.status} notifyUrl={notifyUrl} />

      <section className="admin-card">
        <h2>Itens</h2>
        <div className="admin-table-wrap admin-table-plain">
          <table className="admin-table">
            <thead><tr><th>Produto</th><th>Tamanho</th><th>Cor</th><th>Qtd.</th><th>Preço</th><th>Total</th></tr></thead>
            <tbody>
              {order.items.map((i, idx) => (
                <tr key={idx}>
                  <td><Link href={`/admin/produtos/${i.productId}`}><strong>{i.name}</strong></Link>{i.reference && <small>Ref.: {i.reference}</small>}</td>
                  <td>{i.size || "—"}</td>
                  <td>{i.color || "—"}</td>
                  <td>{i.qty}</td>
                  <td>{money(i.price)}</td>
                  <td>{money(i.price * i.qty)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <dl className="admin-totals">
          <dt>Subtotal</dt><dd>{money(order.subtotal)}</dd>
          {order.discount > 0 && <><dt>Desconto{order.couponCode ? ` (${order.couponCode})` : ""}</dt><dd>− {money(order.discount)}</dd></>}
          {order.paymentDiscount > 0 && <><dt>Desconto do Pix</dt><dd>− {money(order.paymentDiscount)}</dd></>}
          <dt>Frete</dt><dd>{money(order.freight)}</dd>
          <dt><strong>Total</strong></dt><dd><strong>{money(order.total)}</strong></dd>
        </dl>
      </section>

      <div className="admin-grid-2">
        <section className="admin-card">
          <h2>Pagamento</h2>
          <p>
            <strong>{METHOD_LABELS[order.paymentMethod]}</strong>{" "}
            <span className={`admin-status ${payment.ok ? "ok" : ""}`}>{payment.label}</span>
          </p>
          {order.paidAt && <p>Pago em {order.paidAt.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" })}</p>}
          {order.paymentId && (
            <p className="admin-hint">
              Id no Mercado Pago: <code>{order.paymentId}</code> —{" "}
              <a href={`https://www.mercadopago.com.br/activities?q=${order.paymentId}`} target="_blank" rel="noopener">ver no Mercado Pago ↗</a>
            </p>
          )}
          {order.paymentMethod !== "whatsapp" && !order.paidAt && (
            <p className="admin-hint">Pedido pago online só entra em preparação sozinho quando o Mercado Pago aprova. Se o cliente não pagar, cancele.</p>
          )}
          <h2 style={{ marginTop: 18 }}>Cliente</h2>
          <p><strong>{order.customerName}</strong></p>
          <p>WhatsApp: {phone ? <a href={`https://wa.me/${phone}`} target="_blank" rel="noopener">{order.customerPhone}</a> : order.customerPhone}</p>
          {order.customerEmail && <p>E-mail: <a href={`mailto:${order.customerEmail}`}>{order.customerEmail}</a></p>}
          {order.notes && <p className="admin-alert">Observações: {order.notes}</p>}
        </section>
        <section className="admin-card">
          <h2>Entrega</h2>
          {order.deliveryMode === "pickup" ? <p>Retirada na loja</p> : (
            <>
              {s && <p><strong>{s.company}{s.service ? ` • ${s.service}` : ""}</strong>{s.deliveryTime ? ` — ${s.deliveryTime} dias úteis` : ""}</p>}
              {a && (
                <p>
                  {a.address}, {a.number}{a.complement ? ` — ${a.complement}` : ""}<br />
                  {a.district} — {a.city}/{a.state}<br />
                  CEP {formatCep(a.cep)}
                </p>
              )}
            </>
          )}
        </section>
      </div>

      <section className="admin-card">
        <h2>Controle interno</h2>
        <form action={saveOrderNotes.bind(null, order.id)}>
          {order.deliveryMode === "delivery" && (
            <label>Código de rastreio
              <input name="trackingCode" defaultValue={order.trackingCode ?? ""} placeholder="Ex.: AB123456789BR" />
            </label>
          )}
          {order.trackingCode && <p className="admin-hint"><a href={trackingUrl(order.trackingCode)} target="_blank" rel="noopener">Acompanhar rastreio ↗</a></p>}
          <label>Anotações (só aparecem aqui)
            <textarea name="adminNotes" rows={3} defaultValue={order.adminNotes ?? ""} placeholder="Forma de pagamento, combinados com o cliente..." />
          </label>
          <button className="btn btn-dark" type="submit">Salvar</button>
        </form>
        <p className="admin-hint" style={{ marginTop: 12 }}>Salve o código de rastreio antes de avisar o cliente sobre o envio: ele vai junto na mensagem.</p>
      </section>
    </>
  );
}
