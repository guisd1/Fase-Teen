"use client";

import { useState, useTransition } from "react";
import { saveStock } from "@/app/admin/actions";

export interface StockRow { id: number; name: string; image: string | null; sizes: { size: string; stock: number }[] }

/** Estoque de todos os produtos numa tela só. */
export default function StockEditor({ initial }: { initial: StockRow[] }) {
  const [rows, setRows] = useState(initial);
  const [changed, setChanged] = useState<Set<number>>(new Set());
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, start] = useTransition();

  const set = (id: number, size: string, value: string) => {
    setRows(r => r.map(p => p.id !== id ? p : {
      ...p,
      sizes: p.sizes.map(s => s.size === size ? { ...s, stock: Math.max(0, Math.floor(Number(value) || 0)) } : s)
    }));
    setChanged(c => new Set(c).add(id));
    setMessage(null);
  };
  const save = () => start(async () => {
    const changes = rows.filter(p => changed.has(p.id)).map(p => ({ id: p.id, stock: Object.fromEntries(p.sizes.map(s => [s.size, s.stock])) }));
    const r = await saveStock(changes);
    if (r.error) setMessage({ ok: false, text: r.error });
    else { setChanged(new Set()); setMessage({ ok: true, text: "Estoque salvo!" }); }
  });

  return (
    <>
      <div className="admin-table-wrap">
        <table className="admin-table admin-stock">
          <thead><tr><th>Produto</th><th>Estoque por tamanho</th><th>Total</th></tr></thead>
          <tbody>
            {rows.map(p => (
              <tr key={p.id} className={changed.has(p.id) ? "is-changed" : ""}>
                <td>
                  <div className="admin-report-product">
                    {p.image ? <img src={p.image} alt="" /> : <span />}
                    <strong>{p.name}</strong>
                  </div>
                </td>
                <td>
                  <div className="admin-stock-sizes">
                    {p.sizes.map(s => (
                      <label key={s.size} className={s.stock === 0 ? "out" : s.stock <= 2 ? "low" : ""}>
                        <span>{s.size}</span>
                        <input type="number" min={0} value={s.stock} onChange={e => set(p.id, s.size, e.target.value)} />
                      </label>
                    ))}
                  </div>
                </td>
                <td>{p.sizes.reduce((n, s) => n + s.stock, 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="admin-save-bar">
        {message && <span className={message.ok ? "admin-ok" : "admin-error"}>{message.text}</span>}
        <button className="btn btn-dark" type="button" onClick={save} disabled={saving || changed.size === 0}>
          {saving ? "Salvando..." : changed.size ? `Salvar estoque (${changed.size} produto${changed.size > 1 ? "s" : ""})` : "Nada alterado"}
        </button>
      </div>
    </>
  );
}
