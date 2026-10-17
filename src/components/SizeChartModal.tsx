"use client";

import { useEffect } from "react";
import type { SizeChart } from "@/db/schema";

/** Tabela de medidas em janela (no celular, sobe de baixo). */
export default function SizeChartModal({ chart, size, productName, note, onClose }: {
  chart: SizeChart;
  /** Tamanho escolhido, destacado na tabela. */
  size: string;
  productName: string;
  /** Regra de troca da loja, mostrada abaixo da tabela. */
  note: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  return (
    <div className="size-modal-wrap" onClick={onClose}>
      <div className="size-modal" role="dialog" aria-modal="true" aria-labelledby="size-modal-title" onClick={e => e.stopPropagation()}>
        <div className="drawer-head">
          <h3 id="size-modal-title">Tabela de medidas</h3>
          <button className="close-btn" type="button" aria-label="Fechar" onClick={onClose}>×</button>
        </div>
        <p className="size-modal-product">{productName}</p>
        <div className="size-chart-scroll">
          <table>
            <thead><tr><th>Tamanho</th>{chart.columns.map(c => <th key={c}>{c}</th>)}</tr></thead>
            <tbody>
              {chart.rows.map(r => (
                <tr key={r.size} className={r.size === size ? "active" : ""}>
                  <td>{r.size}</td>{r.values.map((v, i) => <td key={i}>{v || "–"}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {chart.note && <p>{chart.note}</p>}
        <p>{note}</p>
      </div>
    </div>
  );
}
