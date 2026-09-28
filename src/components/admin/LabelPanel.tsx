"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { OrderLabel } from "@/db/schema";
import { money } from "@/lib/format";
import { cleanCpf, formatCpf, isValidCpf } from "@/lib/cpf";
import { buyLabelAction, cancelLabelAction, labelOptionsAction, printLabelAction, refreshLabelAction } from "@/app/admin/actions";

interface Option { id: string; company: string; service: string; price: number; deliveryTime: number | null; boxes: number }

const STATUS: Record<string, string> = {
  cart: "No carrinho do Melhor Envio (ainda não paga)",
  pending: "Aguardando pagamento",
  paid: "Paga, gerando",
  generated: "Pronta para imprimir e postar",
  posted: "Postada",
  delivered: "Entregue",
  canceled: "Cancelada",
  undelivered: "Não entregue",
  expired: "Expirada"
};

/** Etiqueta do Melhor Envio no pedido: comprar (com confirmação), imprimir, rastrear, cancelar. */
export default function LabelPanel({ orderId, label, customerDocument, chosenService, freight, senderReady }: {
  orderId: number;
  label: OrderLabel | null;
  customerDocument: string | null;
  /** Serviço que a cliente escolheu no checkout (ex.: "Correios PAC"). */
  chosenService: string | null;
  /** Frete cobrado da cliente (0 = frete grátis). */
  freight: number;
  senderReady: boolean;
}) {
  const router = useRouter();
  const [busy, start] = useTransition();
  const [error, setError] = useState("");
  const [options, setOptions] = useState<Option[] | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [service, setService] = useState("");
  const [cpf, setCpf] = useState(customerDocument ?? "");
  const active = label && label.status !== "canceled" ? label : null;

  const run = (fn: () => Promise<{ error?: string } | void>) => start(async () => {
    setError("");
    const r = await fn();
    if (r && "error" in r && r.error) setError(r.error);
    router.refresh();
  });

  const loadOptions = () => start(async () => {
    setError("");
    const r = await labelOptionsAction(orderId);
    if ("error" in r) { setError(r.error ?? ""); return; }
    setOptions(r.options);
    setBalance(r.balance);
    setService(r.chosen ?? r.options[0]?.id ?? "");
  });

  const picked = options?.find(o => o.id === service);
  const buy = () => {
    if (!picked) return;
    const ok = window.confirm(
      `Comprar a etiqueta ${picked.company} ${picked.service} por ${money(picked.price)}?\n\n` +
      "O valor sai do saldo da sua carteira no Melhor Envio."
    );
    if (ok) run(() => buyLabelAction(orderId, picked.id, cpf));
  };

  const print = () => start(async () => {
    setError("");
    const r = await printLabelAction(orderId);
    if (r.error) setError(r.error);
    else if (r.url) window.open(r.url, "_blank", "noopener");
  });

  if (!senderReady) {
    return (
      <section className="admin-card label-panel">
        <h2>Etiqueta de envio</h2>
        <p className="admin-alert">Para comprar etiquetas pelo painel, cadastre primeiro os dados do remetente em <a href="/admin/integracoes#melhor-envio">Integrações → Melhor Envio</a>.</p>
      </section>
    );
  }

  return (
    <section className="admin-card label-panel">
      <h2>Etiqueta de envio <small>Melhor Envio</small></h2>

      {active ? (
        <>
          <p><strong>{active.company} {active.service}</strong> • {money(active.price)}</p>
          <p>Status: <strong>{STATUS[active.status] ?? active.status}</strong></p>
          {active.tracking && <p>Rastreio: <strong>{active.tracking}</strong></p>}
          {active.protocol && <p className="admin-hint">Protocolo {active.protocol}</p>}
          <div className="label-actions">
            {["cart", "paid", "pending"].includes(active.status) && (
              <button className="btn btn-dark" type="button" disabled={busy} onClick={() => run(() => buyLabelAction(orderId, "", cpf))}>
                {busy ? "Aguarde..." : active.status === "cart" ? "Pagar e gerar etiqueta" : "Gerar etiqueta"}
              </button>
            )}
            {["generated", "posted", "delivered"].includes(active.status) && (
              <button className="btn btn-dark" type="button" disabled={busy} onClick={print}>Imprimir etiqueta (PDF)</button>
            )}
            <button className="btn btn-light" type="button" disabled={busy} onClick={() => run(() => refreshLabelAction(orderId))}>Atualizar status</button>
            {!["posted", "delivered"].includes(active.status) && (
              <button
                className="admin-link-btn" type="button" disabled={busy}
                onClick={() => window.confirm("Cancelar esta etiqueta? Se a transportadora ainda não foi avisada, o valor volta para a sua carteira no Melhor Envio.") && run(() => cancelLabelAction(orderId))}
              >Cancelar etiqueta</button>
            )}
          </div>
          {active.status === "generated" && (
            <p className="admin-hint">Imprima, cole na embalagem e leve à agência ou ponto de coleta. Não paga nada lá. O código de rastreio entra no pedido sozinho.</p>
          )}
        </>
      ) : (
        <>
          <p className="admin-hint">
            A cliente escolheu <strong>{chosenService || "—"}</strong>
            {freight === 0 ? " com frete grátis (a etiqueta sai por conta da loja)" : ` e pagou ${money(freight)} de frete`}.
          </p>
          {!options ? (
            <button className="btn btn-light" type="button" disabled={busy} onClick={loadOptions}>{busy ? "Consultando..." : "Ver valores da etiqueta"}</button>
          ) : options.length === 0 ? (
            <p className="admin-alert">Nenhuma opção de envio disponível para este pedido agora.</p>
          ) : (
            <div className="label-buy">
              {balance !== null && <p>Saldo na carteira do Melhor Envio: <strong>{money(balance)}</strong></p>}
              <label>Envio
                <select value={service} onChange={e => setService(e.target.value)}>
                  {options.map(o => (
                    <option key={o.id} value={o.id}>{o.company} {o.service} — {money(o.price)}{o.deliveryTime ? ` — ${o.deliveryTime} dias úteis` : ""}</option>
                  ))}
                </select>
              </label>
              <label>CPF da cliente
                <input inputMode="numeric" value={formatCpf(cpf)} onChange={e => setCpf(cleanCpf(e.target.value))} placeholder="000.000.000-00" />
              </label>
              {!isValidCpf(cpf) && <p className="admin-hint">O Melhor Envio exige o CPF de quem recebe. Pedidos antigos não têm: peça à cliente pelo WhatsApp.</p>}
              {picked && picked.boxes > 1 && <p className="admin-alert">Este pedido vai em {picked.boxes} caixas: compre essa etiqueta direto no site do Melhor Envio.</p>}
              {balance !== null && picked && balance < picked.price && <p className="admin-alert">Saldo insuficiente. Coloque saldo na carteira do Melhor Envio antes de comprar.</p>}
              <button className="btn btn-dark" type="button" disabled={busy || !picked || !isValidCpf(cpf)} onClick={buy}>
                {busy ? "Comprando..." : picked ? `Comprar etiqueta de ${money(picked.price)}` : "Escolha o envio"}
              </button>
            </div>
          )}
          {label?.status === "canceled" && <p className="admin-hint">A etiqueta anterior ({label.company} {label.service}) foi cancelada.</p>}
        </>
      )}
      {error && <p className="admin-error">{error}</p>}
    </section>
  );
}
