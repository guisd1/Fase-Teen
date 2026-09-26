"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { BlobMode } from "@/lib/blob";
import type { HomeImages } from "@/lib/home-images";
import { saveHomeImagesAction } from "@/app/admin/actions";
import { uploadImage } from "./upload-image";

export default function HomeImagesForm({ initial, blobMode, defaultHero }: {
  initial: HomeImages;
  blobMode: BlobMode;
  /** Imagem mostrada no topo quando não há fotos (a do arquivo da loja). */
  defaultHero?: string;
}) {
  const router = useRouter();
  const [images, setImages] = useState<HomeImages>(initial);
  const [uploading, setUploading] = useState(0);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [saving, startSaving] = useTransition();
  const [dragging, setDragging] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const blobReady = blobMode !== null;

  const send = async (files: FileList | null, onDone: (urls: string[]) => void) => {
    if (!files?.length) return;
    setMessage(null);
    const list = [...files];
    setUploading(n => n + list.length);
    const urls: string[] = [];
    for (const file of list) {
      try {
        urls.push(await uploadImage(file, "inicio", blobMode));
      } catch (error) {
        setMessage({ type: "error", text: `Falha ao enviar ${file.name}: ${(error as Error).message}` });
      } finally {
        setUploading(n => n - 1);
      }
    }
    if (urls.length) onDone(urls);
  };

  const moveHero = (from: number, to: number) => {
    if (from === to || to < 0 || to >= images.hero.length) return;
    const hero = [...images.hero];
    const [moved] = hero.splice(from, 1);
    hero.splice(to, 0, moved);
    setImages(i => ({ ...i, hero }));
  };

  const save = () => {
    setMessage(null);
    startSaving(async () => {
      const result = await saveHomeImagesAction(images);
      if (result.error) setMessage({ type: "error", text: result.error });
      else { setMessage({ type: "ok", text: "Página inicial atualizada!" }); router.refresh(); }
    });
  };

  const addButton = (label: string, multiple: boolean, onDone: (urls: string[]) => void) => (
    <label className={`admin-photo admin-photo-add ${blobReady ? "" : "admin-muted"}`}>
      <input type="file" accept="image/*" multiple={multiple} hidden disabled={!blobReady} onChange={e => { send(e.target.files, onDone); e.target.value = ""; }} />
      {label}
    </label>
  );

  const single = (key: "banner" | "about", title: string, hint: string) => (
    <section className="admin-card">
      <h2>{title}</h2>
      <p className="admin-hint">{hint}</p>
      <div className="admin-photos">
        {images[key] ? (
          <div className="admin-photo">
            <img src={images[key]!} alt="" />
            <div>
              <button type="button" onClick={() => setImages(i => ({ ...i, [key]: null }))} aria-label="Remover foto">✕</button>
            </div>
          </div>
        ) : addButton("+ Escolher foto", false, urls => setImages(i => ({ ...i, [key]: urls[0] })))}
      </div>
    </section>
  );

  return (
    <div className="admin-form">
      {!blobReady && (
        <p className="admin-alert">
          Envio de fotos ainda não configurado. Na Vercel: <strong>Storage → Create → Blob</strong>, conecte ao projeto e faça o <strong>Redeploy</strong>.
        </p>
      )}

      <section className="admin-card">
        <h2>Destaque do topo</h2>
        <p className="admin-hint">
          A foto grande ao lado do título da página inicial. Com mais de uma, elas se alternam sozinhas a cada
          5 segundos, na ordem abaixo (arraste para mudar). Fotos em pé (retrato) ficam melhores.
          {defaultHero && " Sem nenhuma foto, aparece a logo."}
        </p>
        <div className="admin-photos">
          {images.hero.map((src, i) => (
            <div
              key={src}
              className={`admin-photo ${dragging === i ? "is-dragging" : ""} ${dragOver === i && dragging !== i ? "is-drop-target" : ""}`}
              draggable
              onDragStart={e => { setDragging(i); e.dataTransfer.effectAllowed = "move"; }}
              onDragOver={e => { if (dragging === null) return; e.preventDefault(); setDragOver(i); }}
              onDrop={e => { e.preventDefault(); if (dragging !== null) moveHero(dragging, i); setDragging(null); setDragOver(null); }}
              onDragEnd={() => { setDragging(null); setDragOver(null); }}
              title="Arraste para mudar a ordem"
            >
              <img src={src} alt="" draggable={false} />
              <div>
                <button type="button" onClick={() => moveHero(i, i - 1)} disabled={i === 0} aria-label="Mover para a esquerda">←</button>
                <button type="button" onClick={() => setImages(im => ({ ...im, hero: im.hero.filter((_, idx) => idx !== i) }))} aria-label="Remover foto">✕</button>
                <button type="button" onClick={() => moveHero(i, i + 1)} disabled={i === images.hero.length - 1} aria-label="Mover para a direita">→</button>
              </div>
            </div>
          ))}
          {images.hero.length < 8 && addButton(uploading ? `Enviando ${uploading}...` : "+ Adicionar fotos", true, urls => setImages(i => ({ ...i, hero: [...i.hero, ...urls].slice(0, 8) })))}
        </div>
      </section>

      {single("banner", "Faixa escura (meio da página)", "Foto ao lado do texto da faixa escura, no meio da página. Sem foto, aparecem as palavras em destaque.")}
      {single("about", "Seção sobre a marca", "Foto ao lado da história da marca, perto do fim da página. Sem foto, aparece o símbolo da logo.")}

      <div className="admin-save-bar">
        {message && <span className={message.type === "error" ? "admin-error" : "admin-ok"}>{message.text}</span>}
        <button className="btn btn-dark" type="button" onClick={save} disabled={saving || uploading > 0}>
          {saving ? "Salvando..." : uploading > 0 ? "Aguardando fotos..." : "Salvar página inicial"}
        </button>
      </div>
    </div>
  );
}
