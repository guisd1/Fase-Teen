"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ORDER_STATUSES, STATUS_LABELS as LABELS, type OrderStatus } from "@/lib/order-status";
import { setOrderStatus } from "@/app/admin/actions";

/** Botões de status e o atalho para avisar o cliente no WhatsApp. */
export default function OrderStatusPanel({ id, status, notifyUrl }: {
  id: number;
  status: OrderStatus;
  /** Link do WhatsApp com a mensagem do status atual (null se o telefone for inválido). */
  notifyUrl: string | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [changed, setChanged] = useState(false);

  const change = (next: OrderStatus) => start(async () => {
    setError("");
    const result = await setOrderStatus(id, next);
    if (result.error) setError(result.error);
    else { setChanged(true); router.refresh(); }
  });

  return (
    <section className="admin-card">
      <h2>Status do pedido</h2>
      <div className="admin-status-steps">
        {ORDER_STATUSES.map(s => (
          <button
            key={s}
            type="button"
            disabled={pending || s === status}
            className={`${s === status ? "active" : ""} status-${s}`}
            onClick={() => change(s)}
          >{LABELS[s]}</button>
        ))}
      </div>
      <p className="admin-hint">
        Ao sair de &quot;Aguardando confirmação&quot; o estoque dos tamanhos é baixado; ao cancelar, ele volta.
      </p>
      {error && <p className="admin-error">{error}</p>}
      {notifyUrl ? (
        <a className={`btn ${changed ? "btn-dark" : "btn-light"}`} href={notifyUrl} target="_blank" rel="noopener">
          Avisar cliente no WhatsApp ({LABELS[status].toLowerCase()})
        </a>
      ) : (
        <p className="admin-hint">O WhatsApp informado pelo cliente não parece um número válido para enviar mensagem.</p>
      )}
    </section>
  );
}
