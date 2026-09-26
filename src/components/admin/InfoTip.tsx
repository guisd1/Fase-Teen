"use client";

import { useEffect, useRef, useState } from "react";

/** Ícone "i" que abre uma explicação ao clicar (fecha ao clicar fora ou apertar Esc). */
export default function InfoTip({ text, label }: { text: string; label: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("click", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("click", close); document.removeEventListener("keydown", esc); };
  }, [open]);
  return (
    <span className="info-tip" ref={ref}>
      <button type="button" aria-label={`Como funciona: ${label}`} aria-expanded={open} onClick={e => { e.preventDefault(); e.stopPropagation(); setOpen(o => !o); }}>i</button>
      {open && <span className="info-tip-box" role="tooltip"><strong>{label}</strong>{text}</span>}
    </span>
  );
}
