"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { upload, uploadPresigned } from "@vercel/blob/client";
import type { BlobMode } from "@/lib/blob";
import type { ProductImage, ProductRow, ProductSize } from "@/db/schema";
import { saveProduct, type ProductInput } from "@/app/admin/actions";
import { youtubeId } from "@/lib/youtube-id";
import YoutubeUploader from "./YoutubeUploader";

const num = (v: number | null | undefined) => (v === null || v === undefined ? "" : String(v).replace(".", ","));

function initialInput(p: ProductRow | null): ProductInput {
  return {
    name: p?.name ?? "",
    reference: p?.reference ?? "",
    category: p?.category ?? "",
    description: p?.description ?? "",
    composition: p?.composition ?? "",
    price: num(p?.price),
    oldPrice: num(p?.oldPrice),
    badge: p?.badge ?? "",
    featured: p?.featured ?? false,
    active: p?.active ?? true,
    sizes: p?.sizes ?? [],
    colors: p?.colors ?? [],
    images: p?.images ?? [],
    youtubeUrl: p?.youtubeUrl ?? "",
    weightKg: num(p?.weightKg),
    lengthCm: num(p?.lengthCm),
    widthCm: num(p?.widthCm),
    heightCm: num(p?.heightCm)
  };
}

export default function ProductForm({ id, initial, categories, youtubeConnected, blobMode }: {
  id: number | null;
  initial: ProductRow | null;
  categories: string[];
  youtubeConnected: boolean;
  /** Como o Vercel Blob está conectado (null = ainda não conectado). */
  blobMode: BlobMode;
}) {
  const router = useRouter();
  const [form, setForm] = useState<ProductInput>(() => initialInput(initial));
  const [colorsText, setColorsText] = useState(form.colors.join(", "));
  const blobConfigured = blobMode !== null;
  const [uploading, setUploading] = useState(0);
  const [uploadColor, setUploadColor] = useState("");
  const colorList = colorsText.split(",").map(c => c.trim()).filter(Boolean);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [saving, startSaving] = useTransition();

  const set = <K extends keyof ProductInput>(key: K, value: ProductInput[K]) => setForm(f => ({ ...f, [key]: value }));
  const field = (key: keyof ProductInput) => ({
    value: form[key] as string,
    onChange: (e: { target: { value: string } }) => set(key, e.target.value as never)
  });

  // ---- Tamanhos e estoque ----
  const setSize = (i: number, patch: Partial<ProductSize>) =>
    set("sizes", form.sizes.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  const addSize = () => set("sizes", [...form.sizes, { size: "", stock: 0 }]);
  const removeSize = (i: number) => set("sizes", form.sizes.filter((_, idx) => idx !== i));

  // ---- Fotos (Vercel Blob) ----
  const addPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    setMessage(null);
    const list = [...files];
    setUploading(n => n + list.length);
    const uploaded: ProductImage[] = [];
    for (const file of list) {
      try {
        const send = blobMode === "presigned" ? uploadPresigned : upload;
        const blob = await send(`produtos/${file.name}`, file, { access: "public", handleUploadUrl: "/api/admin/upload" });
        uploaded.push({ src: blob.url, color: uploadColor || null });
      } catch (error) {
        const raw = error instanceof Error ? error.message : "erro";
        const text = /client token|presigned/i.test(raw)
          ? "o envio não foi autorizado. Confira se o Blob está conectado ao projeto na Vercel e faça o Redeploy."
          : raw;
        setMessage({ type: "error", text: `Falha ao enviar ${file.name}: ${text}` });
      } finally {
        setUploading(n => n - 1);
      }
    }
    setForm(f => ({ ...f, images: [...f.images, ...uploaded] }));
  };
  const movePhoto = (i: number, delta: number) => {
    const j = i + delta;
    if (j < 0 || j >= form.images.length) return;
    const images = [...form.images];
    [images[i], images[j]] = [images[j], images[i]];
    set("images", images);
  };
  const removePhoto = (i: number) => set("images", form.images.filter((_, idx) => idx !== i));
  const setPhotoColor = (i: number, color: string) =>
    set("images", form.images.map((img, idx) => (idx === i ? { ...img, color: color || null } : img)));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const input = { ...form, colors: colorsText.split(",") };
    startSaving(async () => {
      const result = await saveProduct(id, input);
      if (result.error) {
        setMessage({ type: "error", text: result.error });
        return;
      }
      setMessage({ type: "ok", text: "Produto salvo!" });
      if (!id && result.id) router.replace(`/admin/produtos/${result.id}`);
      else router.refresh();
    });
  };

  const videoId = youtubeId(form.youtubeUrl);
  const noPrice = !form.price.trim();

  return (
    <form className="admin-form product-form" onSubmit={submit}>
      <section className="admin-card">
        <h2>Informações</h2>
        <label>Nome do produto *
          <input required {...field("name")} placeholder="Ex.: Vestido Floral" />
        </label>
        <div className="admin-grid-2">
          <label>Código de referência (SKU)
            <input {...field("reference")} placeholder="Ex.: FT-1001" />
          </label>
          <label>Categoria
            <input list="categories" {...field("category")} placeholder="Ex.: Vestidos" />
            <datalist id="categories">{categories.map(c => <option key={c} value={c} />)}</datalist>
          </label>
        </div>
        <label>Descrição
          <textarea rows={4} {...field("description")} placeholder="Conte como é a peça, caimento, ocasião..." />
        </label>
        <label>Composição / cuidados
          <textarea rows={2} {...field("composition")} placeholder="Ex.: 96% algodão, 4% elastano. Lavar à mão." />
        </label>
      </section>

      <section className="admin-card">
        <h2>Preço</h2>
        <div className="admin-grid-3">
          <label>Preço (R$)
            <input inputMode="decimal" {...field("price")} placeholder="89,90" />
          </label>
          <label>Preço antigo (R$) <small>promoção</small>
            <input inputMode="decimal" {...field("oldPrice")} placeholder="119,90" />
          </label>
          <label>Selo <small>opcional</small>
            <input {...field("badge")} placeholder="NOVO, OFERTA..." maxLength={14} />
          </label>
        </div>
        {noPrice && <p className="admin-hint">Sem preço, o produto fica como <strong>rascunho</strong> e não aparece no site.</p>}
      </section>

      <section className="admin-card">
        <h2>Tamanhos e estoque</h2>
        {form.sizes.length === 0 && <p className="admin-hint">Sem tamanhos, o produto é vendido como tamanho único e sem controle de estoque.</p>}
        {form.sizes.map((s, i) => (
          <div className="admin-size-row" key={i}>
            <input placeholder="Tamanho (ex.: 10)" value={s.size} onChange={e => setSize(i, { size: e.target.value })} />
            <input type="number" min={0} placeholder="Estoque" value={s.stock} onChange={e => setSize(i, { stock: Number(e.target.value) })} />
            <button type="button" className="admin-icon-btn" onClick={() => removeSize(i)} aria-label="Remover tamanho">✕</button>
          </div>
        ))}
        <button type="button" className="btn btn-light" onClick={addSize}>+ Adicionar tamanho</button>
        <label>Cores <small>separadas por vírgula</small>
          <input value={colorsText} onChange={e => setColorsText(e.target.value)} placeholder="Rosa, Jeans, Branco" />
        </label>
      </section>

      <section className="admin-card">
        <h2>Fotos</h2>
        <p className="admin-hint">
          A primeira foto é a capa. Use as setas para mudar a ordem. Marque a cor de cada foto: na página do
          produto, ao escolher a cor, o cliente vê as fotos dela. Fotos em &quot;Todas as cores&quot; aparecem sempre.
        </p>
        {!blobConfigured && (
          <p className="admin-alert">
            Envio de fotos ainda não configurado. Na Vercel: <strong>Storage → Create → Blob</strong>, conecte ao
            projeto da loja e faça o <strong>Redeploy</strong>.
          </p>
        )}
        {colorList.length > 0 && (
          <label className="admin-inline">Enviar as próximas fotos como
            <select value={uploadColor} onChange={e => setUploadColor(e.target.value)}>
              <option value="">Todas as cores</option>
              {colorList.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
        )}
        <div className="admin-photos">
          {form.images.map((img, i) => (
            <div className="admin-photo" key={img.src}>
              <img src={img.src} alt="" />
              {colorList.length > 0 && (
                <select className="admin-photo-color" value={img.color ?? ""} onChange={e => setPhotoColor(i, e.target.value)}>
                  <option value="">Todas as cores</option>
                  {colorList.map(c => <option key={c} value={c}>{c}</option>)}
                  {img.color && !colorList.includes(img.color) && <option value={img.color}>{img.color} (removida)</option>}
                </select>
              )}
              <div>
                <button type="button" onClick={() => movePhoto(i, -1)} disabled={i === 0} aria-label="Mover para a esquerda">←</button>
                <button type="button" onClick={() => removePhoto(i)} aria-label="Remover foto">✕</button>
                <button type="button" onClick={() => movePhoto(i, 1)} disabled={i === form.images.length - 1} aria-label="Mover para a direita">→</button>
              </div>
            </div>
          ))}
          <label className={`admin-photo admin-photo-add ${blobConfigured ? "" : "admin-muted"}`}>
            <input type="file" accept="image/*" multiple hidden disabled={!blobConfigured} onChange={e => { addPhotos(e.target.files); e.target.value = ""; }} />
            {uploading ? `Enviando ${uploading}...` : "+ Adicionar fotos"}
          </label>
        </div>
      </section>

      <section className="admin-card">
        <h2>Vídeo do YouTube <small>opcional • aparece por último no carrossel</small></h2>
        {videoId && (
          <div className="admin-video-current">
            <img src={`https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`} alt="" />
            <div>
              <a href={`https://www.youtube.com/watch?v=${videoId}`} target="_blank" rel="noopener">Abrir no YouTube ↗</a>
              <button type="button" className="admin-link-btn" onClick={() => set("youtubeUrl", "")}>Remover vídeo do produto</button>
            </div>
          </div>
        )}
        {!videoId && (
          <YoutubeUploader
            connected={youtubeConnected}
            defaultTitle={form.name}
            defaultDescription={form.description}
            onUploaded={(url, warning) => {
              set("youtubeUrl", url);
              setMessage({ type: warning ? "error" : "ok", text: warning ?? "Vídeo enviado! Clique em Salvar produto para vincular." });
            }}
          />
        )}
        <label>Ou cole o link de um vídeo já publicado
          <input {...field("youtubeUrl")} placeholder="https://www.youtube.com/watch?v=..." />
        </label>
      </section>

      <section className="admin-card">
        <h2>Embalagem para o frete</h2>
        <p className="admin-hint">Necessário para calcular o frete pelo Melhor Envio. Sem isso, o cliente só consegue retirar na loja.</p>
        <div className="admin-grid-4">
          <label>Peso (kg)<input inputMode="decimal" {...field("weightKg")} placeholder="0,45" /></label>
          <label>Comprimento (cm)<input inputMode="decimal" {...field("lengthCm")} placeholder="32" /></label>
          <label>Largura (cm)<input inputMode="decimal" {...field("widthCm")} placeholder="25" /></label>
          <label>Altura (cm)<input inputMode="decimal" {...field("heightCm")} placeholder="8" /></label>
        </div>
      </section>

      <section className="admin-card">
        <h2>Exibição</h2>
        <label className="admin-check">
          <input type="checkbox" checked={form.active} onChange={e => set("active", e.target.checked)} />
          Ativo (aparece no site)
        </label>
        <label className="admin-check">
          <input type="checkbox" checked={form.featured} onChange={e => set("featured", e.target.checked)} />
          Destaque (aparece em &quot;Novidades&quot; na página inicial)
        </label>
      </section>

      <div className="admin-save-bar">
        {message && <span className={message.type === "error" ? "admin-error" : "admin-ok"}>{message.text}</span>}
        <button className="btn btn-dark" type="submit" disabled={saving || uploading > 0}>
          {saving ? "Salvando..." : uploading > 0 ? "Aguardando fotos..." : "Salvar produto"}
        </button>
      </div>
    </form>
  );
}
