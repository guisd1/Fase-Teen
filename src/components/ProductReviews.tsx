"use client";

import { useState, type FormEvent } from "react";
import { upload, uploadPresigned } from "@vercel/blob/client";
import type { BlobMode } from "@/lib/blob";
import type { Review, ReviewSummary } from "@/db/reviews";
import { optimized } from "@/lib/image";

const MAX_PHOTOS = 3;

export function Stars({ value, size = 16 }: { value: number; size?: number }) {
  const pct = Math.max(0, Math.min(100, (value / 5) * 100));
  return (
    <span className="stars" style={{ fontSize: size }} aria-label={`${value.toFixed(1).replace(".", ",")} de 5 estrelas`}>
      <span className="stars-base">★★★★★</span>
      <span className="stars-fill" style={{ width: `${pct}%` }}>★★★★★</span>
    </span>
  );
}

const date = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

function ReviewForm({ productId, blobMode, onDone }: { productId: number; blobMode: BlobMode; onDone: () => void }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [note, setNote] = useState("");

  const addPhotos = async (files: FileList | null) => {
    if (!files?.length || !blobMode) return;
    const list = [...files].slice(0, MAX_PHOTOS - photos.length);
    setUploading(true);
    setNote("");
    try {
      const send = blobMode === "presigned" ? uploadPresigned : upload;
      for (const file of list) {
        if (file.size > 5 * 1024 * 1024) { setNote(`"${file.name}" passa de 5 MB.`); continue; }
        const blob = await send(`avaliacoes/${file.name}`, file, { access: "public", handleUploadUrl: "/api/avaliacoes/upload" });
        setPhotos(p => [...p, blob.url]);
      }
    } catch (error) {
      setNote(error instanceof Error ? `Não foi possível enviar a foto: ${error.message}` : "Não foi possível enviar a foto.");
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!rating) { setNote("Escolha de 1 a 5 estrelas."); return; }
    setSending(true);
    setNote("");
    try {
      const r = await fetch("/api/avaliacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, name, rating, comment, images: photos })
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || "Não foi possível enviar a avaliação.");
      onDone();
    } catch (error) {
      setNote(error instanceof Error ? error.message : "Não foi possível enviar a avaliação.");
    } finally {
      setSending(false);
    }
  };

  return (
    <form className="review-form" onSubmit={submit}>
      <div className="review-rating-input" onMouseLeave={() => setHover(0)}>
        <span>Sua nota</span>
        <div>
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              type="button"
              aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
              className={(hover || rating) >= n ? "on" : ""}
              onMouseEnter={() => setHover(n)}
              onClick={() => setRating(n)}
            >★</button>
          ))}
        </div>
      </div>
      <label>Seu nome
        <input required maxLength={60} value={name} onChange={e => setName(e.target.value)} placeholder="Como quer aparecer na avaliação" />
      </label>
      <label>Comentário <span className="optional-label">(opcional)</span>
        <textarea rows={4} maxLength={2000} value={comment} onChange={e => setComment(e.target.value)} placeholder="Conta o que achou: tecido, caimento, tamanho..." />
      </label>
      {blobMode && (
        <div className="review-photos">
          {photos.map(src => (
            <div key={src} className="review-photo">
              <img src={src} alt="" />
              <button type="button" aria-label="Remover foto" onClick={() => setPhotos(p => p.filter(x => x !== src))}>×</button>
            </div>
          ))}
          {photos.length < MAX_PHOTOS && (
            <label className="review-photo review-photo-add">
              {uploading ? "Enviando..." : "+ Foto"}
              <input type="file" accept="image/*" multiple hidden disabled={uploading} onChange={e => { addPhotos(e.target.files); e.target.value = ""; }} />
            </label>
          )}
        </div>
      )}
      <button className="btn btn-dark" type="submit" disabled={sending || uploading}>{sending ? "Enviando..." : "Enviar avaliação"}</button>
      <p className="form-note">{note}</p>
    </form>
  );
}

export default function ProductReviews({ productId, reviews, summary, blobMode }: {
  productId: number;
  reviews: Review[];
  summary: ReviewSummary;
  blobMode: BlobMode;
}) {
  const [writing, setWriting] = useState(false);
  const [sent, setSent] = useState(false);
  const [zoom, setZoom] = useState<string | null>(null);

  return (
    <section className="reviews" id="avaliacoes">
      <div className="reviews-head">
        <div>
          <p className="eyebrow">AVALIAÇÕES</p>
          {summary.total > 0 ? (
            <div className="reviews-summary">
              <strong>{summary.average.toFixed(1).replace(".", ",")}</strong>
              <div><Stars value={summary.average} size={20} /><small>{summary.total} avaliaç{summary.total > 1 ? "ões" : "ão"}</small></div>
            </div>
          ) : (
            <p className="reviews-empty">Este produto ainda não tem avaliações. Seja a primeira pessoa a avaliar!</p>
          )}
        </div>
        {!writing && !sent && <button className="btn btn-light" type="button" onClick={() => setWriting(true)}>Escrever avaliação</button>}
      </div>

      {sent && <p className="reviews-thanks">Obrigado pela avaliação! Ela vai aparecer aqui depois de aprovada.</p>}
      {writing && <ReviewForm productId={productId} blobMode={blobMode} onDone={() => { setWriting(false); setSent(true); }} />}

      <div className="reviews-list">
        {reviews.map(r => (
          <article key={r.id} className="review">
            <div className="review-top">
              <Stars value={r.rating} />
              <strong>{r.name}</strong>
              <small>{date(r.createdAt)}</small>
            </div>
            {r.comment && <p>{r.comment}</p>}
            {r.images.length > 0 && (
              <div className="review-images">
                {r.images.map(src => (
                  <button key={src} type="button" onClick={() => setZoom(src)}><img {...optimized(src, "96px")} alt={`Foto de ${r.name}`} loading="lazy" /></button>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>

      {zoom && (
        <div className="review-zoom" role="dialog" aria-modal="true" onClick={() => setZoom(null)}>
          <img src={zoom} alt="" />
          <button className="modal-close" type="button" aria-label="Fechar">×</button>
        </div>
      )}
    </section>
  );
}
