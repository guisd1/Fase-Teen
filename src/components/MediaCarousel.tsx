"use client";

import { useState, type MouseEvent, type ReactNode } from "react";
import type { Product } from "@/db/products";
import { youtubeId } from "@/lib/youtube-id";
import { imagesForColor } from "@/lib/product-media";
import { Icon } from "./Icons";

type Slide = { type: "image"; src: string } | { type: "youtube"; id: string };

/** Fotos (da cor escolhida primeiro) e o vídeo do YouTube sempre por último. */
function slidesFor(p: Product, color?: string | null): Slide[] {
  const slides: Slide[] = imagesForColor(p.images, color).map(i => ({ type: "image", src: i.src }));
  const video = youtubeId(p.youtubeUrl);
  if (video) slides.push({ type: "youtube", id: video });
  return slides;
}

export default function MediaCarousel({ product, color, className = "", playVideo = false, children }: {
  product: Product;
  /** Cor escolhida: mostra as fotos dessa variação primeiro. */
  color?: string | null;
  className?: string;
  /** true na página do produto (vídeo tocável); false nos cards (só a capa). */
  playVideo?: boolean;
  children?: ReactNode;
}) {
  const slides = slidesFor(product, color);
  const [index, setIndex] = useState(0);
  const multi = slides.length > 1;

  const go = (e: MouseEvent, i: number) => {
    e.preventDefault();
    e.stopPropagation();
    setIndex(((i % slides.length) + slides.length) % slides.length);
  };

  return (
    <div className={`product-image-wrap ${className}`.trim()} data-count={slides.length}>
      <div className="media-track" style={{ transform: `translateX(-${index * 100}%)` }}>
        {slides.map((s, i) => (
          <div className="media-slide" key={i}>
            {s.type === "image" && <img src={s.src} alt={product.name} loading="lazy" />}
            {s.type === "youtube" && (playVideo && i === index
              ? <iframe
                  src={`https://www.youtube-nocookie.com/embed/${s.id}?rel=0&playsinline=1`}
                  title={`Vídeo: ${product.name}`}
                  allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              : <div className="video-cover">
                  <img src={`https://i.ytimg.com/vi/${s.id}/hqdefault.jpg`} alt={`Vídeo: ${product.name}`} loading="lazy" />
                  <span className="video-play" aria-hidden><Icon name="play" /></span>
                </div>)}
          </div>
        ))}
        {slides.length === 0 && <div className="media-slide media-empty">Sem foto</div>}
      </div>
      {multi && (
        <>
          <button className="media-nav prev" type="button" aria-label="Anterior" onClick={e => go(e, index - 1)}>‹</button>
          <button className="media-nav next" type="button" aria-label="Próxima" onClick={e => go(e, index + 1)}>›</button>
          <div className="media-dots">
            {slides.map((_, i) => (
              <span key={i} className={`dot ${i === index ? "active" : ""}`} onClick={e => go(e, i)} />
            ))}
          </div>
        </>
      )}
      {children}
    </div>
  );
}
