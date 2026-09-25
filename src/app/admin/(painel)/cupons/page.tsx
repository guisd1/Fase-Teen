import { adminListCoupons } from "@/db/coupons";
import { couponLabel } from "@/lib/coupon";
import { money } from "@/lib/format";
import { createCoupon, deleteCoupon, setCouponActive } from "../../actions";

const day = (d: Date | null) => d ? d.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }) : null;

function situation(c: { active: boolean; startsAt: Date | null; endsAt: Date | null; maxUses: number | null; uses: number }) {
  const now = new Date();
  if (!c.active) return { label: "Desativado", ok: false };
  if (c.startsAt && c.startsAt > now) return { label: "Agendado", ok: false };
  if (c.endsAt && c.endsAt < now) return { label: "Expirado", ok: false };
  if (c.maxUses !== null && c.uses >= c.maxUses) return { label: "Esgotado", ok: false };
  return { label: "Valendo", ok: true };
}

export default async function CouponsPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;
  const coupons = await adminListCoupons();

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Cupons</h1>
          <p>O cliente digita o código no carrinho. O desconto vale sobre os produtos, não sobre o frete.</p>
        </div>
      </div>

      <section className="admin-card">
        <h2>Novo cupom</h2>
        {erro && <p className="admin-error" style={{ marginBottom: 12 }}>{erro}</p>}
        <form action={createCoupon}>
          <div className="admin-grid-3">
            <label>Código
              <input name="code" required placeholder="DIADASCRIANCAS" style={{ textTransform: "uppercase" }} />
            </label>
            <label>Tipo
              <select name="type" defaultValue="percent">
                <option value="percent">Porcentagem (%)</option>
                <option value="fixed">Valor fixo (R$)</option>
              </select>
            </label>
            <label>Desconto
              <input name="value" required inputMode="decimal" placeholder="10" />
            </label>
          </div>
          <div className="admin-grid-4">
            <label>Compra mínima <small>(opcional)</small>
              <input name="minSubtotal" inputMode="decimal" placeholder="150,00" />
            </label>
            <label>Começa em <small>(opcional)</small>
              <input name="startsAt" type="date" />
            </label>
            <label>Termina em <small>(opcional)</small>
              <input name="endsAt" type="date" />
            </label>
            <label>Limite de usos <small>(opcional)</small>
              <input name="maxUses" type="number" min={1} placeholder="Sem limite" />
            </label>
          </div>
          <button className="btn btn-dark" type="submit">Criar cupom</button>
        </form>
      </section>

      {coupons.length > 0 && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Código</th><th>Desconto</th><th>Validade</th><th>Usos</th><th>Situação</th><th></th></tr></thead>
            <tbody>
              {coupons.map(c => {
                const s = situation(c);
                const from = day(c.startsAt), to = day(c.endsAt);
                return (
                  <tr key={c.id}>
                    <td><strong>{c.code}</strong></td>
                    <td>{couponLabel(c)}{c.minSubtotal ? <small>acima de {money(c.minSubtotal)}</small> : null}</td>
                    <td>{from || to ? `${from ?? "…"} a ${to ?? "…"}` : "Sem prazo"}</td>
                    <td>{c.uses}{c.maxUses !== null ? ` / ${c.maxUses}` : ""}</td>
                    <td><span className={`admin-status ${s.ok ? "ok" : ""}`}>{s.label}</span></td>
                    <td className="admin-row-actions">
                      <form action={setCouponActive.bind(null, c.id, !c.active)}>
                        <button type="submit">{c.active ? "Desativar" : "Ativar"}</button>
                      </form>
                      <form action={deleteCoupon.bind(null, c.id)}>
                        <button type="submit" className="admin-danger">Excluir</button>
                      </form>
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
