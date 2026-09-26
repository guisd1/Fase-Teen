"use client";

import { useEffect, useRef, useState } from "react";
import { money } from "@/lib/format";

interface Latest { id: number; code: string; name: string; total: number }

/**
 * Aviso de pedido novo: com o painel aberto (em qualquer aba do navegador),
 * confere a cada 30 segundos e mostra uma notificação do sistema com som.
 */
export default function OrderNotifier() {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const last = useRef<number | null>(null);

  useEffect(() => {
    setPermission(typeof Notification === "undefined" ? "unsupported" : Notification.permission);
    const check = async () => {
      try {
        const r = await fetch("/api/admin/pedidos-novos", { cache: "no-store" });
        if (!r.ok) return;
        const { latest } = (await r.json()) as { latest: Latest | null };
        if (!latest) return;
        if (last.current !== null && latest.id > last.current) notify(latest);
        last.current = latest.id;
      } catch { /* sem conexão: tenta de novo depois */ }
    };
    check();
    const timer = setInterval(check, 30_000);
    return () => clearInterval(timer);
  }, []);

  const notify = (o: Latest) => {
    document.title = `Pedido novo! nº ${o.code}`;
    try {
      // Bipe curto sem arquivo de áudio.
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      osc.frequency.value = 880;
      osc.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch { /* sem som */ }
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      const n = new Notification(`Pedido novo nº ${o.code}`, { body: `${o.name} • ${money(o.total)}`, tag: `pedido-${o.id}` });
      n.onclick = () => { window.focus(); window.location.href = `/admin/pedidos/${o.id}`; };
    }
  };

  const enable = async () => {
    if (typeof Notification === "undefined") return;
    setPermission(await Notification.requestPermission());
  };

  if (permission === "granted" || permission === "unsupported") return null;
  return (
    <button type="button" className="admin-notify-btn" onClick={enable}>
      {permission === "denied" ? "Avisos bloqueados no navegador" : "Ativar aviso de pedido novo"}
    </button>
  );
}
