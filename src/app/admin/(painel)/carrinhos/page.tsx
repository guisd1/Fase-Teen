import { adminAbandonedCarts, adminRecoveredCount } from "@/db/recovery";
import { customerWhatsapp } from "@/lib/order-messages";
import { money } from "@/lib/format";
import { getStore } from "@/stores";
import { deleteCartAction, markCartContactedAction } from "../../actions";

const dateTime = (d: Date) => d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });

export default async function AbandonedCartsPage() {
  const store = getStore();
  const [carts, recovered] = await Promise.all([adminAbandonedCarts(), adminRecoveredCount()]);
  const open = carts.filter(c => !c.contactedAt);
  const contacted = carts.filter(c => c.contactedAt);

  const message = (c: (typeof carts)[number]) => {
    const first = c.name.split(" ")[0];
    const items = c.items.map(i => `${i.name}${i.size ? ` (tam. ${i.size})` : ""}`).join(", ");
    return `Oi, ${first}! Tudo bem? Aqui é da ${store.name}. Vi que você deixou ${items} no carrinho do nosso site. Ficou alguma dúvida sobre tamanho, frete ou pagamento? Posso te ajudar a finalizar! ${store.siteUrl}`;
  };

  const table = (list: typeof carts, title: string) => list.length > 0 && (
    <>
      <h2 className="admin-report-title">{title}</h2>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Cliente</th><th>Carrinho</th><th>Valor</th><th>Quando</th><th></th></tr></thead>
          <tbody>
            {list.map(c => {
              const wa = customerWhatsapp(c.phone);
              return (
                <tr key={c.id}>
                  <td><strong>{c.name}</strong><small>{[c.phone, c.email].filter(Boolean).join(" • ")}</small></td>
                  <td>{c.items.map((i, idx) => <small key={idx}>{i.qty}× {i.name}{i.size ? ` • ${i.size}` : ""}{i.color ? ` • ${i.color}` : ""}</small>)}</td>
                  <td>{money(c.subtotal)}</td>
                  <td>{dateTime(c.updatedAt)}{c.contactedAt && <small>chamada em {dateTime(c.contactedAt)}</small>}</td>
                  <td className="admin-row-actions">
                    {wa && <a href={`https://wa.me/${wa}?text=${encodeURIComponent(message(c))}`} target="_blank" rel="noopener">Chamar no WhatsApp</a>}
                    {!c.contactedAt && <form action={markCartContactedAction.bind(null, c.id)}><button type="submit">Marcar como chamada</button></form>}
                    <form action={deleteCartAction.bind(null, c.id)}><button type="submit">Remover</button></form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Carrinhos abandonados</h1>
          <p>Quem preencheu nome e WhatsApp no checkout e não finalizou nos últimos 30 dias (depois de 30 minutos parado). Quando a pessoa faz o pedido, sai daqui sozinha.</p>
        </div>
      </div>
      <div className="admin-report-totals">
        <div><small>Para chamar</small><strong>{open.length}</strong></div>
        <div><small>Já chamadas</small><strong>{contacted.length}</strong></div>
        <div><small>Recuperados (30 dias)</small><strong>{recovered}</strong></div>
      </div>
      {carts.length === 0 && <div className="admin-empty"><p>Nenhum carrinho abandonado agora.</p></div>}
      {table(open, "Para chamar")}
      {table(contacted, "Já chamadas (aguardando)")}
      <p className="admin-hint">
        Dica: chame no mesmo dia, com uma mensagem simples e oferecendo ajuda com tamanho ou frete. O botão já abre o
        WhatsApp com uma mensagem pronta, que você pode editar antes de enviar.
      </p>
    </>
  );
}
