"use client";

import { useState } from "react";
import type { Product } from "@/db/products";

/** "Avise-me quando chegar": aparece quando algum tamanho está esgotado. */
export default function NotifyMe({ product }: { product: Product }) {
  const outSizes = product.sizes.filter(s => s.stock <= 0).map(s => s.size);
  const [open, setOpen] = useState(false);
  const [size, setSize] = useState(outSizes[0] ?? "");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [sending, setSending] = useState(false);
  if (!outSizes.length) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setStatus(null);
    try {
      const r = await fetch("/api/avise-me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, size, name, phone })
      });
      const data = await r.json().catch(() => ({}));
      setStatus(r.ok ? { ok: true, text: `Pronto! Avisamos você no WhatsApp quando o tamanho ${size} chegar.` } : { ok: false, text: data.error || "Não foi possível salvar." });
    } catch {
      setStatus({ ok: false, text: "Sem conexão. Tente de novo." });
    } finally {
      setSending(false);
    }
  };

  if (!open) {
    return (
      <button type="button" className="text-link notify-link" onClick={() => setOpen(true)}>
        {outSizes.length === product.sizes.length ? "Esgotado? Avise-me quando chegar" : `Tamanho ${outSizes.join(", ")} esgotado? Avise-me quando chegar`}
      </button>
    );
  }
  return (
    <form className="notify-form" onSubmit={submit}>
      {status?.ok ? <p className="notify-ok">{status.text}</p> : (
        <>
          <strong>Avise-me quando chegar</strong>
          {outSizes.length > 1 && (
            <label>Tamanho
              <select value={size} onChange={e => setSize(e.target.value)}>{outSizes.map(s => <option key={s}>{s}</option>)}</select>
            </label>
          )}
          <input required placeholder="Seu nome" value={name} onChange={e => setName(e.target.value)} autoComplete="name" />
          <input required inputMode="tel" placeholder="WhatsApp com DDD" value={phone} onChange={e => setPhone(e.target.value)} autoComplete="tel" />
          {status && <p className="notify-error">{status.text}</p>}
          <button className="btn btn-dark full" type="submit" disabled={sending}>{sending ? "Enviando..." : `Avisar quando o ${size} chegar`}</button>
          <small>Usamos seu WhatsApp só para este aviso.</small>
        </>
      )}
    </form>
  );
}
