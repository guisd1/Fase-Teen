"use client";

import { useEffect, useState } from "react";

/*
  Notificação de pedido novo neste aparelho (Web Push): chega mesmo com o painel
  fechado. Cada aparelho/navegador ativa uma vez. No iPhone, só funciona com o
  painel adicionado à Tela de Início (limite da Apple).
*/

type State = "loading" | "unsupported" | "ios-install" | "off" | "on" | "denied" | "working";

function keyToBytes(base64: string) {
  const pad = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, c => c.charCodeAt(0));
}

const deviceName = () => {
  const ua = navigator.userAgent;
  const os = /iPhone|iPad/.test(ua) ? "iPhone" : /Android/.test(ua) ? "Android" : /Mac/.test(ua) ? "Mac" : /Windows/.test(ua) ? "Windows" : "Aparelho";
  const browser = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "navegador";
  return `${os} • ${browser}`;
};

export default function OrderNotifier() {
  const [state, setState] = useState<State>("loading");
  const [error, setError] = useState("");
  const [tested, setTested] = useState(false);

  const test = async () => {
    setTested(true);
    await fetch("/api/admin/push", { method: "PUT" }).catch(() => {});
    setTimeout(() => setTested(false), 3000);
  };

  useEffect(() => {
    (async () => {
      const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
      const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || typeof Notification === "undefined") {
        setState(ios && !standalone ? "ios-install" : "unsupported");
        return;
      }
      if (Notification.permission === "denied") { setState("denied"); return; }
      try {
        const reg = await navigator.serviceWorker.register("/sw.js");
        const sub = await reg.pushManager.getSubscription();
        setState(sub && Notification.permission === "granted" ? "on" : "off");
      } catch {
        setState("unsupported");
      }
    })();
  }, []);

  const enable = async () => {
    setError("");
    setState("working");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setState(permission === "denied" ? "denied" : "off"); return; }
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const { publicKey } = await (await fetch("/api/admin/push", { cache: "no-store" })).json();
      const sub = (await reg.pushManager.getSubscription()) ?? await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyToBytes(publicKey) });
      const r = await fetch("/api/admin/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON(), device: deviceName() })
      });
      if (!r.ok) throw new Error("O servidor não aceitou este aparelho.");
      setState("on");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível ativar.");
      setState("off");
    }
  };

  const disable = async () => {
    setState("working");
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/admin/push", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) });
        await sub.unsubscribe();
      }
    } finally {
      setState("off");
    }
  };

  if (state === "loading") return null;
  return (
    <div className="admin-notify">
      {state === "on" && (
        <div className="notify-card">
          <span className="notify-status"><i aria-hidden /> Notificações ativas</span>
          <small>Você recebe um aviso a cada pedido neste aparelho.</small>
          <div className="notify-actions">
            <button type="button" onClick={test} disabled={tested}>{tested ? "Enviado!" : "Testar"}</button>
            <button type="button" onClick={disable}>Desativar</button>
          </div>
        </div>
      )}
      {(state === "off" || state === "working") && (
        <button type="button" className="admin-notify-btn" disabled={state === "working"} onClick={enable}>
          {state === "working" ? "Ativando..." : "Ativar notificação de pedido neste aparelho"}
        </button>
      )}
      {state === "denied" && <span className="admin-notify-hint">Notificações bloqueadas. Libere nas configurações do navegador para este site.</span>}
      {state === "ios-install" && (
        <span className="admin-notify-hint">No iPhone: toque em Compartilhar → Adicionar à Tela de Início, abra o painel pelo ícone e ative aqui.</span>
      )}
      {state === "unsupported" && <span className="admin-notify-hint">Este navegador não aceita notificações.</span>}
      {error && <span className="admin-notify-hint">{error}</span>}
    </div>
  );
}
