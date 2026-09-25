"use client";

import { useState } from "react";

type Privacy = "public" | "unlisted" | "private";

/** Envia o vídeo do navegador direto para o YouTube (upload retomável), com progresso. */
function putWithProgress(url: string, file: File, onProgress: (pct: number) => void) {
  return new Promise<{ id?: string }>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = e => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)); };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try { resolve(JSON.parse(xhr.responseText)); } catch { resolve({}); }
      } else {
        reject(new Error(`O YouTube recusou o arquivo (${xhr.status}).`));
      }
    };
    xhr.onerror = () => reject(new Error("Falha de conexão durante o envio."));
    xhr.send(file);
  });
}

export default function YoutubeUploader({ connected, defaultTitle, defaultDescription, onUploaded }: {
  connected: boolean;
  defaultTitle: string;
  defaultDescription: string;
  /** warning: o vídeo foi enviado, mas algo secundário (a capa) falhou. */
  onUploaded: (url: string, warning?: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [thumb, setThumb] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [privacy, setPrivacy] = useState<Privacy>("public");
  const [madeForKids, setMadeForKids] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [status, setStatus] = useState("");

  if (!connected) {
    return (
      <p className="admin-hint">
        Para enviar vídeos pelo painel, conecte o canal em <a href="/admin/integracoes">Integrações → YouTube</a>.
      </p>
    );
  }

  if (!open) {
    return (
      <button type="button" className="btn btn-light" onClick={() => {
        setTitle(defaultTitle);
        setDescription(defaultDescription);
        setOpen(true);
      }}>Enviar vídeo para o YouTube</button>
    );
  }

  const busy = progress !== null;

  const send = async () => {
    if (!file) { setStatus("Escolha o arquivo de vídeo."); return; }
    if (!title.trim()) { setStatus("Informe o título."); return; }
    if (thumb && thumb.size > 2 * 1024 * 1024) { setStatus("A capa precisa ter no máximo 2 MB."); return; }
    setStatus("Preparando envio...");
    setProgress(0);
    try {
      const r = await fetch("/api/admin/youtube/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title, description, privacy, madeForKids,
          tags: hashtags.split(/[\s,]+/),
          size: file.size, mimeType: file.type || "video/mp4"
        })
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || "Não foi possível iniciar o envio.");

      setStatus("Enviando vídeo...");
      const video = await putWithProgress(data.uploadUrl, file, setProgress);
      if (!video.id) throw new Error("O YouTube não retornou o id do vídeo.");

      let warning: string | undefined;
      if (thumb) {
        setStatus("Enviando capa...");
        const body = new FormData();
        body.set("videoId", video.id);
        body.set("image", thumb);
        const t = await fetch("/api/admin/youtube/thumbnail", { method: "POST", body });
        if (!t.ok) {
          const err = await t.json().catch(() => ({}));
          // O vídeo já foi publicado; só a capa falhou.
          warning = `Vídeo enviado, mas a capa falhou: ${err.error || t.status}. Troque a capa pelo YouTube Studio.`;
        }
      }
      onUploaded(`https://www.youtube.com/watch?v=${video.id}`, warning);
      setStatus("");
      setOpen(false);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Falha no envio.");
    } finally {
      setProgress(null);
    }
  };

  return (
    <div className="admin-yt">
      <label>Arquivo de vídeo
        <input type="file" accept="video/*" disabled={busy} onChange={e => setFile(e.target.files?.[0] ?? null)} />
      </label>
      <label>Título
        <input value={title} maxLength={100} disabled={busy} onChange={e => setTitle(e.target.value)} />
      </label>
      <label>Descrição
        <textarea rows={3} value={description} maxLength={4500} disabled={busy} onChange={e => setDescription(e.target.value)} />
      </label>
      <label>Hashtags <small>separadas por espaço ou vírgula</small>
        <input value={hashtags} disabled={busy} onChange={e => setHashtags(e.target.value)} placeholder="#modainfantil #lookdodia" />
      </label>
      <div className="admin-grid-2">
        <label>Visibilidade
          <select value={privacy} disabled={busy} onChange={e => setPrivacy(e.target.value as Privacy)}>
            <option value="public">Público</option>
            <option value="unlisted">Não listado (só quem tem o link)</option>
            <option value="private">Privado</option>
          </select>
        </label>
        <label>Imagem de capa <small>opcional, até 2 MB</small>
          <input type="file" accept="image/jpeg,image/png" disabled={busy} onChange={e => setThumb(e.target.files?.[0] ?? null)} />
        </label>
      </div>
      <label className="admin-check">
        <input type="checkbox" checked={madeForKids} disabled={busy} onChange={e => setMadeForKids(e.target.checked)} />
        Vídeo feito para crianças (regra do YouTube; desativa comentários)
      </label>
      {busy && <progress max={100} value={progress ?? 0} />}
      {status && <p className="admin-hint">{status}{busy && progress ? ` ${progress}%` : ""}</p>}
      <div className="admin-row">
        <button type="button" className="btn btn-dark" disabled={busy} onClick={send}>{busy ? "Enviando..." : "Enviar para o YouTube"}</button>
        <button type="button" className="btn btn-light" disabled={busy} onClick={() => setOpen(false)}>Cancelar</button>
      </div>
    </div>
  );
}
