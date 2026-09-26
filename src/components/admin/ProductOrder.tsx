"use client";

import { useState, useTransition } from "react";
import { saveProductOrder } from "@/app/admin/actions";

export interface OrderItem { id: number; name: string; image: string | null; active: boolean }

/** Arrastar os produtos para definir a ordem em que aparecem no site. */
export default function ProductOrder({ initial }: { initial: OrderItem[] }) {
  const [items, setItems] = useState(initial);
  const [dragging, setDragging] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, start] = useTransition();

  const move = (from: number, to: number) => {
    if (from === to || to < 0 || to >= items.length) return;
    const next = [...items];
    const [m] = next.splice(from, 1);
    next.splice(to, 0, m);
    setItems(next);
    setMessage(null);
  };
  const save = () => start(async () => {
    const r = await saveProductOrder(items.map(i => i.id));
    setMessage(r.error ? { ok: false, text: r.error } : { ok: true, text: "Ordem salva! O site já mostra nesta ordem." });
  });

  return (
    <>
      <ol className="admin-order">
        {items.map((p, i) => (
          <li
            key={p.id}
            draggable
            className={`${dragging === i ? "is-dragging" : ""} ${over === i && dragging !== i ? "is-drop-target" : ""} ${p.active ? "" : "admin-muted"}`}
            onDragStart={e => { setDragging(i); e.dataTransfer.effectAllowed = "move"; }}
            onDragOver={e => { if (dragging === null) return; e.preventDefault(); setOver(i); }}
            onDrop={e => { e.preventDefault(); if (dragging !== null) move(dragging, i); setDragging(null); setOver(null); }}
            onDragEnd={() => { setDragging(null); setOver(null); }}
          >
            <span className="admin-order-pos">{i + 1}</span>
            {p.image ? <img src={p.image} alt="" draggable={false} /> : <span className="admin-order-noimg" />}
            <strong>{p.name}</strong>
            {!p.active && <small>inativo</small>}
            <span className="admin-order-arrows">
              <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Subir">↑</button>
              <button type="button" onClick={() => move(i, i + 1)} disabled={i === items.length - 1} aria-label="Descer">↓</button>
            </span>
          </li>
        ))}
      </ol>
      <div className="admin-save-bar">
        {message && <span className={message.ok ? "admin-ok" : "admin-error"}>{message.text}</span>}
        <button className="btn btn-dark" type="button" onClick={save} disabled={saving}>{saving ? "Salvando..." : "Salvar ordem"}</button>
      </div>
    </>
  );
}
