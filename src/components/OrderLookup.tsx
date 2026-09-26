"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OrderLookup() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [contact, setContact] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/pedidos/buscar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, contact })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) { setError(data.error || "Não foi possível buscar o pedido."); return; }
      router.push(data.url);
    } catch {
      setError("Sem conexão. Tente de novo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="order-lookup" onSubmit={submit}>
      <label>Número do pedido
        <input inputMode="numeric" maxLength={6} required value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ""))} placeholder="Ex.: 482913" />
      </label>
      <label>E-mail ou telefone usado na compra
        <input required value={contact} onChange={e => setContact(e.target.value)} placeholder="seu@email.com ou (38) 99999-9999" />
      </label>
      {error && <p className="order-lookup-error">{error}</p>}
      <button className="btn btn-dark full" type="submit" disabled={loading}>{loading ? "Buscando..." : "Ver meu pedido"}</button>
    </form>
  );
}
