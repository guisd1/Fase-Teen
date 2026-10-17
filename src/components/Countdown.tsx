"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { FlashSale } from "@/lib/promotions";

/** Milissegundos até `endsAt`, atualizado a cada segundo (null até carregar no navegador). */
export function useTimeLeft(endsAt: string): number | null {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  return now === null ? null : Math.max(0, Date.parse(endsAt) - now);
}

export const splitTime = (ms: number) => ({
  d: Math.floor(ms / 864e5), h: Math.floor(ms / 36e5) % 24, m: Math.floor(ms / 6e4) % 60, s: Math.floor(ms / 1e3) % 60
});

const two = (n: number) => String(n).padStart(2, "0");

/** "05:42:10" ou "2d 05:42:10". */
export function clockText(ms: number) {
  const p = splitTime(ms);
  return `${p.d > 0 ? `${p.d}d ` : ""}${two(p.h)}:${two(p.m)}:${two(p.s)}`;
}

/** Barra do topo durante a promoção relâmpago. */
export function FlashBar({ flash }: { flash: FlashSale }) {
  const left = useTimeLeft(flash.endsAt);
  const content = (
    <>
      <span>{flash.text}</span>
      {left !== null && left > 0 && <span className="flash-clock">termina em <strong>{clockText(left)}</strong></span>}
    </>
  );
  return flash.link
    ? <Link className="topbar topbar-flash" href={flash.link}>{content}</Link>
    : <div className="topbar topbar-flash">{content}</div>;
}

/** Aviso no carrinho quando há item da promoção relâmpago. */
export function CartFlashNote({ endsAt, percent }: { endsAt: string; percent: number }) {
  const left = useTimeLeft(endsAt);
  if (left === null || left <= 0) return null;
  return (
    <div className="cart-flash" role="timer">
      <span><strong>{Math.round(percent)}% OFF</strong> nos itens da promoção relâmpago</span>
      <span>termina em <strong>{clockText(left)}</strong></span>
    </div>
  );
}
