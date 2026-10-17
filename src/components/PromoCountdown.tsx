"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const LABELS = { d: "dias", h: "horas", m: "min", s: "seg" } as const;

/** Contagem até o fim da promoção com data do produto (mesmo horário para todo mundo). */
export default function PromoCountdown({ percent, endsAt }: { percent: number; endsAt: string }) {
  const router = useRouter();
  const [now, setNow] = useState<number | null>(null);
  const end = new Date(endsAt).getTime();

  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Acabou: busca de novo os dados para o preço voltar ao normal.
  const over = now !== null && end - now <= 0;
  useEffect(() => {
    if (over) router.refresh();
  }, [over, router]);

  // Só aparece depois de carregar no navegador (evita mostrar uma contagem que já terminou).
  if (now === null || over) return null;
  const left = end - now;
  const p = { d: Math.floor(left / 864e5), h: Math.floor(left / 36e5) % 24, m: Math.floor(left / 6e4) % 60, s: Math.floor(left / 1e3) % 60 };
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
