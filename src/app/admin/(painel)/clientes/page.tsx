import { adminCustomers } from "@/db/insights";
import { customerWhatsapp } from "@/lib/order-messages";
import { money } from "@/lib/format";
import { SOURCE_LABELS } from "@/lib/traffic-source";

const date = (d: Date) => d.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
const normalize = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = normalize((await searchParams).q?.trim() ?? "");
  const all = (await adminCustomers()).sort((a, b) => b.spent - a.spent || b.lastOrder.getTime() - a.lastOrder.getTime());
  const digits = q.replace(/\D/g, "");
  const customers = all.filter(c => !q || normalize(c.name).includes(q) || (digits && c.phone.replace(/\D/g, "").includes(digits)) || (c.email ?? "").toLowerCase().includes(q));
  const buyers = all.filter(c => c.orders > 0);
  const repeat = buyers.filter(c => c.orders > 1).length;

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Clientes</h1>
          <p>Todo mundo que já fez pedido, agrupado pelo telefone. Ordenado por quem mais comprou.</p>
        </div>
        <div className="admin-head-actions">
          <a className="btn btn-light" href="/admin/exportar/clientes">Baixar planilha de clientes</a>
          <a className="btn btn-light" href="/admin/exportar/pedidos">Baixar planilha de pedidos</a>
        </div>
      </div>

      <div className="admin-report-totals">
        <div><small>Clientes</small><strong>{all.length}</strong></div>
        <div><small>Já compraram</small><strong>{buyers.length}</strong></div>
        <div><small>Compraram mais de uma vez</small><strong>{repeat}</strong></div>
      </div>

      <form className="admin-search" action="/admin/clientes">
        <input name="q" type="search" defaultValue={q} placeholder="Buscar por nome, telefone ou e-mail" />
        <button className="btn btn-dark" type="submit">Buscar</button>
      </form>

      {customers.length === 0 ? (
        <div className="admin-empty"><p>{q ? "Nenhum cliente encontrado nesta busca." : "Nenhum cliente ainda. Eles aparecem aqui a partir do primeiro pedido."}</p></div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Cliente</th><th>Pedidos</th><th>Total gasto</th><th>Último pedido</th><th>Veio de</th><th></th></tr>
            </thead>
            <tbody>
              {customers.map(c => {
                const wa = customerWhatsapp(c.phone);
                return (
                  <tr key={c.key}>
                    <td><strong>{c.name}</strong><small>{[c.phone, c.email].filter(Boolean).join(" • ")}</small></td>
                    <td>{c.orders}{c.allOrders > c.orders && <small>{c.allOrders} no total</small>}</td>
                    <td>{money(c.spent)}</td>
                    <td>{date(c.lastOrder)}</td>
                    <td>{c.firstSource ? SOURCE_LABELS[c.firstSource] ?? c.firstSource : "–"}</td>
                    <td className="admin-row-actions">
                      {wa && <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener">WhatsApp</a>}
                      <a href={`/admin/pedidos?q=${encodeURIComponent(c.phone)}`}>Pedidos</a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
