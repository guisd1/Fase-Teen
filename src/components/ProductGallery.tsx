"use client";

import { useState, type MouseEvent } from "react";
import type { Product } from "@/db/products";
import { youtubeId } from "@/lib/youtube-id";
import { imagesForColor } from "@/lib/product-media";
import { Icon } from "./Icons";
import { optimized } from "@/lib/image";

type Slide = { type: "image"; src: string } | { type: "youtube"; id: string };

/** Quanto a janela de zoom amplia a foto. */
const ZOOM = 2.5;

/**
 * Galeria da página do produto, como no Mercado Livre: miniaturas ao lado,
 * a foto inteira num quadro de tamanho fixo e, no computador, um quadrado
 * que segue o mouse e mostra a região ampliada numa janela ao lado.
 * No celular, as miniaturas ficam embaixo e não há zoom.
 */
export default function ProductGallery({ product, color }: { product: Product; color?: string | null }) {
  const slides: Slide[] = imagesForColor(product.images, color).map(i => ({ type: "image", src: i.src }));
  const video = youtubeId(product.youtubeUrl);
  if (video) slides.push({ type: "youtube", id: video });

  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  // Proporção da foto: a janela de zoom usa a mesma, para não distorcer.
  const [aspect, setAspect] = useState(0.8);
  const current = slides[index];

  // Posição do mouse dentro da foto (0 a 1), limitada para o quadrado não sair da borda.
  const track = (e: MouseEvent<HTMLImageElement>) => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const img = e.currentTarget;
    const r = img.getBoundingClientRect();
    if (img.naturalWidth) setAspect(img.naturalWidth / img.naturalHeight);
    const half = 0.5 / ZOOM;
    const clamp = (v: number) => Math.min(1 - half, Math.max(half, v));
    setZoom({ x: clamp((e.clientX - r.left) / r.width), y: clamp((e.clientY - r.top) / r.height) });
  };

  return (
    <div className="gallery">
      {slides.length > 1 && (
        <div className="gallery-thumbs">
          {slides.map((s, i) => (
            <button
              key={i}
              type="button"
              className={i === index ? "active" : ""}
              onMouseEnter={() => setIndex(i)}
              onClick={() => setIndex(i)}
              aria-label={s.type === "youtube" ? "Vídeo" : `Foto ${i + 1}`}
            >
              <img {...(s.type === "image" ? optimized(s.src, "64px") : { src: `https://i.ytimg.com/vi/${s.id}/default.jpg` })} alt="" />
              {s.type === "youtube" && <span className="gallery-play"><Icon name="play" /></span>}
            </button>
          ))}
        </div>
      )}

      <div className="gallery-frame">
        {!current && <div className="gallery-empty">Sem foto</div>}
        {current?.type === "youtube" && (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${current.id}?rel=0&playsinline=1`}
            title={`Vídeo: ${product.name}`}
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )}
        {current?.type === "image" && (
          <div className="gallery-photo">
            <img
              {...optimized(current.src, "(max-width: 760px) 100vw, 480px")}
              alt={product.name}
              onMouseMove={track}
              onMouseLeave={() => setZoom(null)}
            />
            {zoom && (
              <span
                className="gallery-lens"
                style={{ width: `${100 / ZOOM}%`, height: `${100 / ZOOM}%`, left: `${(zoom.x - 0.5 / ZOOM) * 100}%`, top: `${(zoom.y - 0.5 / ZOOM) * 100}%` }}
              />
            )}
          </div>
        )}
        {slides.length > 1 && (
          <div className="gallery-dots">
            {slides.map((_, i) => <button key={i} type="button" className={i === index ? "active" : ""} onClick={() => setIndex(i)} aria-label={`Ir para ${i + 1}`} />)}
          </div>
        )}
      </div>

      {zoom && current?.type === "image" && (
        <div
          className="gallery-zoom"
          aria-hidden
          style={{
            backgroundImage: `url("${current.src}")`,
            aspectRatio: String(aspect),
            backgroundSize: `${ZOOM * 100}% ${ZOOM * 100}%`,
            backgroundPosition: `${((zoom.x - 0.5 / ZOOM) / (1 - 1 / ZOOM)) * 100}% ${((zoom.y - 0.5 / ZOOM) / (1 - 1 / ZOOM)) * 100}%`
          }}
        />
      )}
    </div>
  );
}
