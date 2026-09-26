import { adminWaitlist } from "@/db/recovery";
import { productSlug } from "@/db/products";
import { customerWhatsapp } from "@/lib/order-messages";
import { getStore } from "@/stores";
import { deleteWaitlistAction, markWaitlistNotifiedAction } from "../../actions";

const date = (d: Date) => d.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });

export default async function WaitlistPage() {
  const store = getStore();
  const list = await adminWaitlist();
  const ready = list.filter(w => w.stock > 0);
  const waiting = list.filter(w => w.stock <= 0);

  const table = (rows: typeof list, title: string, canNotify: boolean) => rows.length > 0 && (
    <>
      <h2 className="admin-report-title">{title}</h2>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Cliente</th><th>Produto</th><th>Tamanho</th><th>Estoque agora</th><th>Pediu em</th><th></th></tr></thead>
          <tbody>
            {rows.map(w => {
              const wa = customerWhatsapp(w.phone);
              const link = `${store.siteUrl}/produto/${productSlug({ id: w.productId, name: w.productName })}`;
              const text = `Oi, ${w.name.split(" ")[0]}! Aqui é da ${store.name}. Chegou${w.size ? ` o tamanho ${w.size} do` : " o"} ${w.productName} que você pediu para avisar. Garanta o seu: ${link}`;
              return (
                <tr key={w.id}>
                  <td><strong>{w.name}</strong><small>{w.phone}</small></td>
                  <td>{w.productName}</td>
                  <td>{w.size || "–"}</td>
                  <td>{w.stock > 0 ? <strong className="admin-paid">{w.stock} un.</strong> : "esgotado"}</td>
                  <td>{date(w.createdAt)}</td>
                  <td className="admin-row-actions">
                    {canNotify && wa && <a href={`https://wa.me/${wa}?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener">Avisar no WhatsApp</a>}
                    {canNotify && <form action={markWaitlistNotifiedAction.bind(null, w.id)}><button type="submit">Marcar como avisada</button></form>}
                    <form action={deleteWaitlistAction.bind(null, w.id)}><button type="submit">Remover</button></form>
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
          <h1>Avise-me quando chegar</h1>
          <p>Clientes que pediram aviso de um tamanho esgotado. Quando você repõe o estoque, eles aparecem em &quot;Pronto para avisar&quot;.</p>
        </div>
      </div>
      <div className="admin-report-totals">
        <div><small>Pronto para avisar</small><strong>{ready.length}</strong></div>
        <div><small>Esperando reposição</small><strong>{waiting.length}</strong></div>
      </div>
      {list.length === 0 && <div className="admin-empty"><p>Ninguém pediu aviso ainda. O botão aparece na página do produto quando algum tamanho está esgotado.</p></div>}
      {table(ready, "Pronto para avisar (já tem estoque)", true)}
      {table(waiting, "Esperando reposição", false)}
    </>
  );
}
