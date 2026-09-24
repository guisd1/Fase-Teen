"use client";

import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import type { Product } from "@/db/products";
import type { ProductMedia } from "@/db/schema";

export function mainImage(p: Product) {
  return p.media.find(m => m.type !== "video")?.src ?? "";
}

export default function MediaCarousel({ product, className = "", children }: {
  product: Product;
  className?: string;
  children?: ReactNode;
}) {
  const media: ProductMedia[] = product.media;
  const [index, setIndex] = useState(0);
  const videos = useRef<(HTMLVideoElement | null)[]>([]);
  const multi = media.length > 1;

  useEffect(() => {
    videos.current.forEach((v, i) => { if (v && i !== index) v.pause(); });
  }, [index]);

  const go = (e: MouseEvent, i: number) => {
    e.preventDefault();
    e.stopPropagation();
    setIndex(((i % media.length) + media.length) % media.length);
  };

  return (
    <div className={`product-image-wrap ${className}`.trim()} data-count={media.length}>
      <div className="media-track" style={{ transform: `translateX(-${index * 100}%)` }}>
        {media.map((m, i) => (
          <div className="media-slide" key={i}>
            {m.type === "video"
              ? <video ref={el => { videos.current[i] = el; }} src={m.src} muted loop playsInline preload="metadata" controls />
              : <img src={m.src} alt={product.name} loading="lazy" />}
          </div>
        ))}
      </div>
      {multi && (
        <>
          <button className="media-nav prev" type="button" aria-label="Imagem anterior" onClick={e => go(e, index - 1)}>‹</button>
          <button className="media-nav next" type="button" aria-label="Próxima imagem" onClick={e => go(e, index + 1)}>›</button>
          <div className="media-dots">
            {media.map((_, i) => (
              <span key={i} className={`dot ${i === index ? "active" : ""}`} onClick={e => go(e, i)} />
            ))}
          </div>
        </>
      )}
      {children}
    </div>
  );
}
