"use client";

import { useState, type FormEvent } from "react";

export default function NewsletterForm({ welcome = null }: { welcome?: { code: string; label: string } | null }) {
  const [coupon, setCoupon] = useState(false);
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const em = email.trim();
    setSending(true);
    setNote("Enviando...");
    try {
      const r = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: em })
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || "Não foi possível cadastrar seu e-mail agora.");
      setNote(`Pronto! ${em} foi cadastrado com sucesso.`);
      if (welcome) setCoupon(true);
      setEmail("");
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Não foi possível cadastrar seu e-mail agora.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <form onSubmit={submit}>
        <input type="email" placeholder="Seu melhor e-mail" required value={email} onChange={e => setEmail(e.target.value)} />
        <button className="btn btn-dark" type="submit" disabled={sending}>Quero receber</button>
      </form>
      <p className="form-note">{note}</p>
      {coupon && welcome && (
        <div className="welcome-coupon">
          <small>Seu cupom de {welcome.label} na primeira compra:</small>
          <strong>{welcome.code}</strong>
          <small>Use no carrinho, antes de finalizar o pedido.</small>
        </div>
      )}
    </>
  );
}
