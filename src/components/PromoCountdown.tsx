"use client";

import { splitTime, useTimeLeft } from "./Countdown";

const LABELS = { d: "dias", h: "horas", m: "min", s: "seg" } as const;

/** Contagem até o fim da promoção com data do produto (mesmo horário para todo mundo). */
export default function PromoCountdown({ percent, endsAt }: { percent: number; endsAt: string }) {
  const left = useTimeLeft(endsAt);
  // Só aparece depois de carregar no navegador (evita mostrar uma contagem que já terminou).
  // Quando acaba, a loja troca o preço de volta sozinha (ShopShell).
  if (left === null || left <= 0) return null;
  const p = splitTime(left);
  const parts = (p.d > 0 ? ["d", "h", "m", "s"] : ["h", "m", "s"]) as (keyof typeof p)[];

  return (
    <div className="promo-countdown" role="timer" aria-label={`Promoção de ${Math.round(percent)}% off termina em ${p.d} dias, ${p.h} horas e ${p.m} minutos`}>
      <p><strong>{Math.round(percent)}% OFF</strong> termina em</p>
      <div className="promo-clock">
        {parts.map(k => (
          <div key={k}><strong>{String(p[k]).padStart(2, "0")}</strong><small>{LABELS[k]}</small></div>
        ))}
      </div>
    </div>
  );
}
