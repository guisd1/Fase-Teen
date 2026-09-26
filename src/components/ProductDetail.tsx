"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import type { Product } from "@/db/products";
import type { ReviewSummary } from "@/db/reviews";
import { Stars } from "./ProductReviews";
import { money } from "@/lib/format";
import ProductGallery from "./ProductGallery";
import { PixPrice, PriceRow, soldOut } from "./ProductCard";
import { useShop } from "./ShopShell";
import { landedFromOutside, track } from "@/lib/track";
import { detectSource } from "@/lib/traffic-source";

export default function ProductDetail({ product, reviewSummary, children }: {
  product: Product;
  reviewSummary: ReviewSummary;
  /** Seções abaixo do produto (avaliações). */
  children?: ReactNode;
}) {
  const { store, cart, openCart } = useShop();
  const firstAvailable = product.sizes.find(s => s.stock > 0)?.size ?? "";
  const [size, setSize] = useState(firstAvailable);
  const [color, setColor] = useState(product.colors[0] ?? "");
  const [shared, setShared] = useState(false);
  const [chartOpen, setChartOpen] = useState(false);
  const chart = product.sizeChart;

  useEffect(() => {
    track("view", product.id);
    if (landedFromOutside()) {
      track("link", product.id);
      if (detectSource().source === "anuncio") track("ad", product.id);
    }
  }, [product.id]);
  const outOfStock = soldOut(product);
  const installments = store.commerce.installments;

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: product.name, url });
      else { await navigator.clipboard.writeText(url); setShared(true); }
      // Só conta quando o compartilhamento foi até o fim (cancelar cai no catch).
      track("share", product.id);
    } catch { /* compartilhamento cancelado */ }
  };

  return (
    <main className="product-page">
      <nav className="breadcrumb">
        <Link href="/">Início</Link> / <Link href="/#colecao">{product.category || "Coleção"}</Link> / <span>{product.name}</span>
      </nav>
      <div className="quick-product">
        {/* key: volta para a primeira foto ao trocar de cor */}
        <ProductGallery key={color} product={product} color={color} />
        <div className="quick-info">
          {product.category && <div className="product-category">{product.category}</div>}
          <h1>{product.name}</h1>
          {product.reference && <div className="product-ref">Ref.: {product.reference}</div>}
          {reviewSummary.total > 0 && (
            <a className="product-rating" href="#avaliacoes">
              <Stars value={reviewSummary.average} /> <small>({reviewSummary.total})</small>
            </a>
          )}
          <PriceRow product={product} />
          <PixPrice product={product} />
          {installments > 1 && <div className="installment">ou {installments}x de {money(product.price / installments)}*</div>}
          {product.description && <p className="quick-desc">{product.description}</p>}
          {product.composition && (
            <div className="option-row">
              <span>COMPOSIÇÃO / DETALHES</span>
              <p className="quick-composition">{product.composition}</p>
            </div>
          )}
          {product.sizes.length > 0 && (
            <div className="option-row">
              <span>TAMANHO</span>
              <div className="option-chips">
                {product.sizes.map(s => (
                  <button
                    key={s.size}
                    type="button"
                    disabled={s.stock <= 0}
                    title={s.stock <= 0 ? "Esgotado" : `${s.stock} em estoque`}
                    className={`option-chip ${s.size === size ? "active" : ""}`}
                    onClick={() => setSize(s.size)}
                  >{s.size}</button>
                ))}
              </div>
            </div>
          )}
          {chart && (
            <div className="size-chart">
              <button type="button" className="text-link" aria-expanded={chartOpen} onClick={() => setChartOpen(o => !o)}>
                {chartOpen ? "Esconder tabela de medidas" : "Ver tabela de medidas"}
              </button>
              {chartOpen && (
                <div className="size-chart-box">
                  <div className="size-chart-scroll">
                    <table>
                      <thead><tr><th>Tamanho</th>{chart.columns.map(c => <th key={c}>{c}</th>)}</tr></thead>
                      <tbody>
                        {chart.rows.map(r => (
                          <tr key={r.size} className={r.size === size ? "active" : ""}>
                            <td>{r.size}</td>{r.values.map((v, i) => <td key={i}>{v || "–"}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {chart.note && <p>{chart.note}</p>}
                  <p><strong>Não fazemos troca por tamanho.</strong> Confira as medidas antes de comprar.</p>
                </div>
              )}
            </div>
          )}
          {product.colors.length > 0 && (
            <div className="option-row">
              <span>COR</span>
              <div className="option-chips">
                {product.colors.map(c => {
                  const photo = product.images.find(i => i.color === c);
                  return (
                    <button key={c} type="button" className={`option-chip ${photo ? "color-chip" : ""} ${c === color ? "active" : ""}`} onClick={() => setColor(c)}>
                      {photo && <img src={photo.src} alt="" />}
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <button
            className="btn btn-dark quick-buy"
            type="button"
            disabled={outOfStock}
            onClick={() => { cart.addToCart({ id: product.id, size, color, qty: 1 }); track("cart", product.id); openCart(); }}
          >
            {outOfStock ? "Esgotado" : "Adicionar ao carrinho"}
          </button>
          <button className="btn btn-light share-btn" type="button" onClick={share}>
            {shared ? "Link copiado!" : "Compartilhar produto"}
          </button>
          {store.commerce.shippingNote && <p className="shipping-note">{store.commerce.shippingNote}</p>}
        </div>
      </div>
      {children}
    </main>
  );
}
