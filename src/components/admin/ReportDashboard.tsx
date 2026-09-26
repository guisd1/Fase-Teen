"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { DailyStat } from "@/db/stats";
import InfoTip from "./InfoTip";

type Metric = Exclude<keyof DailyStat, "day">;

export interface ReportCard {
  key: string;
  label: string;
  hint: string;
  /** Texto do total (já formatado). */
  value: string;
}

/*
  Cor fixa por métrica (não muda ao ligar/desligar outras linhas). Ordem
  validada para daltonismo (scripts do guia de gráficos): amarelo, azul,
  roxo, rosa, verde, turquesa, laranja.
*/
const COLORS: Record<Metric, string> = {
  views: "#eda100",
  clicks: "#2a78d6",
  carts: "#4a3aa7",
  shares: "#e87ba4",
  sold: "#008300",
  linkOpens: "#1baf7a",
  adOpens: "#eb6834"
};
const isMetric = (k: string): k is Metric => k in COLORS;

const STORAGE = "relatorio-linhas";
const H = 260, PAD = { top: 16, right: 16, bottom: 28, left: 40 };

const shortDay = (day: string) => `${day.slice(8, 10)}/${day.slice(5, 7)}`;
const longDay = (day: string) => {
  const s = new Date(`${day}T12:00:00Z`).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short", timeZone: "UTC" });
  return s.charAt(0).toUpperCase() + s.slice(1);
};

/** Marcas do eixo Y em números "redondos" (0, 5, 10... ou 0, 20, 40...). */
function ticks(max: number) {
  if (max <= 4) return [0, 1, 2, 3, 4].slice(0, Math.max(2, max + 1));
  const raw = max / 4;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => s >= raw)!;
  return Array.from({ length: Math.ceil(max / step) + 1 }, (_, i) => i * step);
}

export default function ReportDashboard({ cards, extraCards, daily }: {
  /** Quadrinhos que viram linhas no gráfico. */
  cards: ReportCard[];
  /** Quadrinhos só de total (valor em R$, taxas): não entram no gráfico. */
  extraCards: ReportCard[];
  daily: DailyStat[];
}) {
  const [active, setActive] = useState<Metric[]>(["views"]);
  const [hover, setHover] = useState<number | null>(null);
  const [width, setWidth] = useState(800);
  const box = useRef<HTMLDivElement>(null);

  // Lembra as linhas escolhidas neste navegador.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE) ?? "null");
      if (Array.isArray(saved)) setActive(saved.filter(isMetric));
    } catch { /* sem localStorage */ }
  }, []);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(300, e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const toggle = (key: Metric) => {
    setActive(list => {
      const next = list.includes(key) ? list.filter(k => k !== key) : [...list, key];
      try { localStorage.setItem(STORAGE, JSON.stringify(next)); } catch { /* ignora */ }
      return next;
    });
  };

  const max = Math.max(1, ...daily.flatMap(d => active.map(k => d[k])));
  const yTicks = useMemo(() => ticks(max), [max]);
  const top = yTicks[yTicks.length - 1];
  const plotW = width - PAD.left - PAD.right, plotH = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (daily.length === 1 ? plotW / 2 : (i / (daily.length - 1)) * plotW);
  const y = (v: number) => PAD.top + plotH - (v / top) * plotH;
  const labelEvery = Math.max(1, Math.ceil(daily.length / Math.floor(plotW / 56)));
  // Datas do eixo X espaçadas; a última só entra se não encostar na anterior.
  const lastIdx = daily.length - 1;
  const showLabel = (i: number) =>
    i % labelEvery === 0 || (i === lastIdx && lastIdx % labelEvery >= labelEvery * 0.7);
  const labelOf = (k: string) => cards.find(c => c.key === k)?.label ?? k;

  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const rel = (e.clientX - r.left) / r.width;
    setHover(Math.round(rel * (daily.length - 1)));
  };

  return (
    <div className="report-dash">
      <div className="admin-report-totals">
        {cards.map(c => {
          const on = isMetric(c.key) && active.includes(c.key);
          return (
            // div com papel de botão: o "i" de explicação é um botão e não pode ficar dentro de outro.
            <div
              key={c.key}
              role="button"
              tabIndex={0}
              className={`report-card ${on ? "on" : ""}`}
              style={on && isMetric(c.key) ? { borderColor: COLORS[c.key] } : undefined}
              aria-pressed={on}
              onClick={() => isMetric(c.key) && toggle(c.key)}
              onKeyDown={e => { if ((e.key === "Enter" || e.key === " ") && isMetric(c.key)) { e.preventDefault(); toggle(c.key); } }}
              title={on ? "Clique para tirar do gráfico" : "Clique para mostrar no gráfico"}
            >
              <small>
                {isMetric(c.key) && <i className="report-key" style={{ background: on ? COLORS[c.key] : undefined }} />}
                {c.label} <InfoTip label={c.label} text={c.hint} />
              </small>
              <strong>{c.value}</strong>
            </div>
          );
        })}
        {extraCards.map(c => (
          <div key={c.key} className="report-card static">
            <small>{c.label} <InfoTip label={c.label} text={c.hint} /></small>
            <strong>{c.value}</strong>
          </div>
        ))}
      </div>

      <div className="report-chart" ref={box}>
        {active.length === 0 ? (
          <p className="report-chart-empty">Clique em um dos quadrinhos acima (Visualizações, No carrinho...) para ver a linha no gráfico.</p>
        ) : daily.length < 2 ? (
          <p className="report-chart-empty">O gráfico mostra a evolução por dia. Escolha 7 dias ou mais.</p>
        ) : (
          <svg width={width} height={H} role="img" aria-label={`Gráfico por dia: ${active.map(labelOf).join(", ")}`}>
            {yTicks.map(t => (
              <g key={t}>
                <line className="report-grid" x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} />
                <text className="report-axis" x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end">{t.toLocaleString("pt-BR")}</text>
              </g>
            ))}
            {daily.map((d, i) => showLabel(i) ? (
              <text key={d.day} className="report-axis" x={x(i)} y={H - 8} textAnchor="middle">{shortDay(d.day)}</text>
            ) : null)}
            {active.map(k => (
              <polyline
                key={k}
                fill="none"
                stroke={COLORS[k]}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                points={daily.map((d, i) => `${x(i)},${y(d[k])}`).join(" ")}
              />
            ))}
            {hover !== null && (
              <g>
                <line className="report-crosshair" x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + plotH} />
                {active.map(k => (
                  <circle key={k} cx={x(hover)} cy={y(daily[hover][k])} r={4.5} fill={COLORS[k]} stroke="white" strokeWidth={2} />
                ))}
              </g>
            )}
            <rect
              x={PAD.left} y={PAD.top} width={plotW} height={plotH} fill="transparent"
              onPointerMove={onMove} onPointerLeave={() => setHover(null)}
            />
          </svg>
        )}
        {hover !== null && active.length > 0 && daily[hover] && (
          <div
            className="report-tooltip"
            style={{ left: Math.min(Math.max(x(hover) + 12, 0), width - 190), top: PAD.top }}
          >
            <div className="report-tooltip-day">{longDay(daily[hover].day)}</div>
            {active.map(k => (
              <div key={k} className="report-tooltip-row">
                <i style={{ background: COLORS[k] }} />
                <strong>{daily[hover][k].toLocaleString("pt-BR")}</strong>
                <span>{labelOf(k)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
