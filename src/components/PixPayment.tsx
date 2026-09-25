"use client";

import { useEffect, useState } from "react";
import { money } from "@/lib/format";

export interface PixData {
  pixCode?: string;
  pixQrBase64?: string;
  pixExpiresAt?: string;
}

export interface PublicOrderStatus {
  code: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string | null;
  paid: boolean;
  total: number;
}

/** Consulta o status do pedido a cada 5 segundos até ele ser pago (ou `active` virar falso). */
export function useOrderStatus(token: string, active: boolean, onPaid?: () => void) {
  const [status, setStatus] = useState<PublicOrderStatus | null>(null);
  useEffect(() => {
    if (!active) return;
    let stop = false;
    const check = async () => {
      try {
        const r = await fetch(`/api/pedidos/status?token=${token}`, { cache: "no-store" });
        if (!r.ok) return;
        const data: PublicOrderStatus = await r.json();
        if (stop) return;
        setStatus(data);
        if (data.paid) { stop = true; onPaid?.(); }
      } catch { /* sem internet: tenta de novo no próximo ciclo */ }
    };
    check();
    const timer = setInterval(() => { if (!stop) check(); }, 5000);
    return () => { stop = true; clearInterval(timer); };
  }, [token, active]); // eslint-disable-line react-hooks/exhaustive-deps
  return status;
}

function useCountdown(until?: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  if (!until) return null;
  const left = Math.max(0, new Date(until).getTime() - now);
  return { expired: left === 0, text: `${Math.floor(left / 60000)}:${String(Math.floor(left / 1000) % 60).padStart(2, "0")}` };
}

/** QR Code e "copia e cola" do Pix. Quem mostra decide o que fazer quando o pagamento é confirmado. */
export default function PixPayment({ pix, total }: { pix: PixData; total: number }) {
  const [copied, setCopied] = useState(false);
  const countdown = useCountdown(pix.pixExpiresAt);

  const copy = async () => {
    if (!pix.pixCode) return;
    try {
      await navigator.clipboard.writeText(pix.pixCode);
    } catch {
      // Navegadores sem acesso à área de transferência: seleciona o texto para copiar à mão.
      (document.getElementById("pix-code") as HTMLTextAreaElement | null)?.select();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (countdown?.expired) {
    return <p className="pix-expired">Este código Pix expirou. Faça o pedido de novo para gerar outro.</p>;
  }

  return (
    <div className="pix-box">
      <p className="pix-total">Total no Pix: <strong>{money(total)}</strong></p>
      {pix.pixQrBase64 && <img className="pix-qr" src={`data:image/png;base64,${pix.pixQrBase64}`} alt="QR Code do Pix" />}
      <p className="pix-hint">Abra o app do seu banco, escolha <strong>Pix → Ler QR Code</strong> ou use o código abaixo em <strong>Pix copia e cola</strong>.</p>
      <textarea id="pix-code" className="pix-code" readOnly rows={3} value={pix.pixCode ?? ""} onFocus={e => e.target.select()} />
      <button className="btn btn-dark full" type="button" onClick={copy}>{copied ? "Código copiado!" : "Copiar código Pix"}</button>
      <p className="pix-waiting"><span className="pix-dot" /> Aguardando o pagamento{countdown ? ` • expira em ${countdown.text}` : ""}</p>
    </div>
  );
}
