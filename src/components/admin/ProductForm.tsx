"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { upload, uploadPresigned } from "@vercel/blob/client";
import type { BlobMode } from "@/lib/blob";
import type { ProductImage, ProductRow, ProductSize, SizeChart } from "@/db/schema";
import { saveProduct, type ProductInput } from "@/app/admin/actions";
import { youtubeId } from "@/lib/youtube-id";
import YoutubeUploader from "./YoutubeUploader";
import { cardPrice, pixPrice, priceFromMarkup, type MarkupType, type PaymentFees } from "@/lib/pricing";
import { money } from "@/lib/format";

const num = (v: number | null | undefined) => (v === null || v === undefined ? "" : String(v).replace(".", ","));

/** "89,90", "89.90" ou "1.299,90" → número; vazio ou inválido → null. */
function parseMoney(value: string) {
  const v = value.trim();
  if (!v) return null;
  const n = Number(v.includes(",") ? v.replace(/\./g, "").replace(",", ".") : v);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function initialInput(p: ProductRow | null): ProductInput {
  return {
    name: p?.name ?? "",
    reference: p?.reference ?? "",
    category: p?.category ?? "",
    description: p?.description ?? "",
    composition: p?.composition ?? "",
    price: num(p?.price),
    costPrice: num(p?.costPrice),
    markupType: p?.markupType ?? "percent",
    markupValue: num(p?.markupValue),
    oldPrice: num(p?.oldPrice),
    badge: p?.badge ?? "",
    featured: p?.featured ?? false,
    active: p?.active ?? true,
    sizes: p?.sizes ?? [],
    sizeChart: p?.sizeChart ?? null,
    colors: p?.colors ?? [],
    images: p?.images ?? [],
    youtubeUrl: p?.youtubeUrl ?? "",
    weightKg: num(p?.weightKg),
    lengthCm: num(p?.lengthCm),
    widthCm: num(p?.widthCm),
    heightCm: num(p?.heightCm)
  };
}

export default function ProductForm({ id, initial, categories, youtubeConnected, blobMode, fees }: {
  id: number | null;
  initial: ProductRow | null;
  categories: string[];
  youtubeConnected: boolean;
  /** Como o Vercel Blob está conectado (null = ainda não conectado). */
  blobMode: BlobMode;
  /** Taxas do Mercado Pago que entram no preço do site (zero sem Mercado Pago). */
  fees: PaymentFees;
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

  // ---- Tabela de medidas: uma linha por tamanho cadastrado ----
  const chartSizes = form.sizes.map(s => s.size.trim()).filter(Boolean);
  const chartRows = chartSizes.length ? chartSizes : ["Único"];
  const chart = form.sizeChart;
  const chartValue = (size: string, col: number) => chart?.rows.find(r => r.size === size)?.values[col] ?? "";
  const setChart = (next: SizeChart | null) => set("sizeChart", next);
  const startChart = () => setChart({ columns: ["Busto", "Cintura", "Comprimento"], rows: [], note: "Medidas da peça em centímetros." });
  const setColumn = (i: number, name: string) => chart && setChart({ ...chart, columns: chart.columns.map((c, idx) => (idx === i ? name : c)) });
  const addColumn = () => chart && setChart({ ...chart, columns: [...chart.columns, ""] });
  const removeColumn = (i: number) => chart && setChart({
    ...chart,
    columns: chart.columns.filter((_, idx) => idx !== i),
    rows: chart.rows.map(r => ({ ...r, values: r.values.filter((_, idx) => idx !== i) }))
  });
  const setCell = (size: string, col: number, value: string) => {
    if (!chart) return;
    const row = chart.rows.find(r => r.size === size) ?? { size, values: [] };
    const values = chart.columns.map((_, idx) => (idx === col ? value : row.values[idx] ?? ""));
    setChart({ ...chart, rows: [...chart.rows.filter(r => r.size !== size), { size, values }] });
  };

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
    const input = {
      ...form,
      colors: colorsText.split(","),
      sizeChart: chart && { ...chart, rows: chartRows.map(size => ({ size, values: chart.columns.map((_, i) => chartValue(size, i)) })) }
    };
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
  // ---- Preço: custo + mark-up calculam o valor a receber ----
  const cost = parseMoney(form.costPrice);
  const markup = parseMoney(form.markupValue);
  const fromMarkup = cost !== null && markup !== null ? priceFromMarkup(cost, form.markupType, markup) : null;
  const netPrice = fromMarkup ?? parseMoney(form.price);
  const noPrice = !netPrice;
  const profit = netPrice && cost !== null ? netPrice - cost : null;
  // Guarda o último valor calculado: apagando o custo, o campo manual já começa com ele.
  useEffect(() => {
    if (fromMarkup !== null) setForm(f => ({ ...f, price: num(fromMarkup) }));
  }, [fromMarkup]);

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
          <label>Custo da peça (R$) <small>só você vê</small>
            <input inputMode="decimal" {...field("costPrice")} placeholder="80,00" />
          </label>
          <label>Mark-up <small>sobre o custo</small>
            <span className="admin-markup">
              <input inputMode="decimal" {...field("markupValue")} placeholder={form.markupType === "percent" ? "100" : "70,00"} />
              <select value={form.markupType} onChange={e => set("markupType", e.target.value as MarkupType)} aria-label="Tipo de mark-up">
                <option value="percent">%</option>
                <option value="fixed">R$</option>
              </select>
            </span>
          </label>
          <label>Quanto quer receber (R$)
            {fromMarkup !== null ? (
              <input value={num(fromMarkup)} readOnly className="admin-computed" title="Calculado pelo custo + mark-up. Apague o custo para digitar à mão." />
            ) : (
              <input inputMode="decimal" {...field("price")} placeholder="89,90" />
            )}
          </label>
        </div>
        {fromMarkup !== null && cost !== null && markup !== null && (
          <p className="admin-hint">
            {money(cost)} {form.markupType === "percent" ? `+ ${String(markup).replace(".", ",")}%` : `+ ${money(markup)}`} = <strong>{money(fromMarkup)}</strong> a receber.
            {" "}Para digitar o valor à mão, apague o custo.
          </p>
        )}
        <div className="admin-grid-3">
          <label>Preço antigo (R$) <small>promoção, também sem taxa</small>
            <input inputMode="decimal" {...field("oldPrice")} placeholder="119,90" />
          </label>
          <label>Selo <small>opcional</small>
            <input {...field("badge")} placeholder="NOVO, OFERTA..." maxLength={14} />
          </label>
        </div>
        {noPrice && <p className="admin-hint">Sem preço, o produto fica como <strong>rascunho</strong> e não aparece no site.</p>}
        {netPrice && (
          <div className="admin-price-summary">
            {(fees.cardPercent > 0 || fees.pixPercent > 0) ? (
              <span>
                No site: <strong>{money(cardPrice(netPrice, fees))}</strong> no cartão e <strong>{money(pixPrice(netPrice, fees))}</strong> no Pix
                <small> (taxas do Mercado Pago de {String(fees.cardPercent).replace(".", ",")}% e {String(fees.pixPercent).replace(".", ",")}%, ajustáveis em Integrações)</small>
              </span>
            ) : (
              <span>No site: <strong>{money(netPrice)}</strong></span>
            )}
            {profit !== null && (
              <span className={profit < 0 ? "admin-error" : ""}>
                Lucro por peça: <strong>{money(profit)}</strong> ({Math.round(profit / netPrice * 100)}% do valor recebido)
              </span>
            )}
          </div>
        )}
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
        <h2>Tabela de medidas <small>aparece na página do produto</small></h2>
        {!chart ? (
          <>
            <p className="admin-hint">Como a loja não faz troca por tamanho, a tabela ajuda a cliente a escolher certo.</p>
            <button type="button" className="btn btn-light" onClick={startChart}>+ Criar tabela de medidas</button>
          </>
        ) : (
          <>
            <p className="admin-hint">
              Dê nome às medidas (colunas) e preencha os valores de cada tamanho. As linhas seguem os tamanhos
              cadastrados acima. Coluna sem nome e tamanho sem valores não aparecem no site.
            </p>
            <div className="admin-chart-wrap">
              <table className="admin-chart">
                <thead>
                  <tr>
                    <th>Tamanho</th>
                    {chart.columns.map((c, i) => (
                      <th key={i}>
                        <input value={c} onChange={e => setColumn(i, e.target.value)} placeholder="Medida" aria-label={`Nome da coluna ${i + 1}`} />
                        <button type="button" className="admin-icon-btn" onClick={() => removeColumn(i)} aria-label="Remover coluna">✕</button>
                      </th>
                    ))}
                    {chart.columns.length < 8 && (
                      <th><button type="button" className="admin-link-btn" onClick={addColumn}>+ Coluna</button></th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {chartRows.map(size => (
                    <tr key={size}>
                      <td>{size}</td>
                      {chart.columns.map((_, i) => (
                        <td key={i}>
                          <input value={chartValue(size, i)} onChange={e => setCell(size, i, e.target.value)} placeholder="ex.: 62" aria-label={`${chart.columns[i] || "Medida"} do tamanho ${size}`} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <label>Observação <small>abaixo da tabela</small>
              <input value={chart.note ?? ""} onChange={e => setChart({ ...chart, note: e.target.value })} placeholder="Medidas da peça em centímetros." />
            </label>
            <button type="button" className="admin-link-btn" onClick={() => setChart(null)}>Remover tabela de medidas</button>
          </>
        )}
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
