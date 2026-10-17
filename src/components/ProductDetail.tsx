"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import type { Product } from "@/db/products";
import type { ReviewSummary } from "@/db/reviews";
import { Stars } from "./ProductReviews";
import { money } from "@/lib/format";
import ProductGallery from "./ProductGallery";
import { PixPrice, PriceRow, soldOut } from "./ProductCard";
import { useShop } from "./ShopShell";
import { Icon } from "./Icons";
import RelatedProducts from "./RelatedProducts";
import NotifyMe from "./NotifyMe";
import PromoCountdown from "./PromoCountdown";
import ProductShipping from "./ProductShipping";
import SizeChartModal from "./SizeChartModal";
import FavoriteButton from "./FavoriteButton";
import { landedFromOutside, track } from "@/lib/track";
import { detectSource } from "@/lib/traffic-source";
import { optimized } from "@/lib/image";

export default function ProductDetail({ product: initial, reviewSummary, children }: {
  product: Product;
  reviewSummary: ReviewSummary;
  /** Seções abaixo do produto (avaliações). */
  children?: ReactNode;
}) {
  const { store, products, cart, openCart, promotions, onlinePayments, setWhatsappText } = useShop();
  // Mesmo produto, com o preço que vale agora (a promoção pode ter começado ou acabado com a página aberta).
  const product = products.find(p => p.id === initial.id) ?? initial;
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
  // Estoque baixo do tamanho escolhido (painel → Promoções); null = não mostra.
  const sizeStock = product.sizes.find(s => s.size === size)?.stock ?? 0;
  const lowStock = promotions.lowStockLimit !== null && sizeStock > 0 && sizeStock <= promotions.lowStockLimit ? sizeStock : null;
  const installments = store.commerce.installments;
  const returnDays = store.commerce.returnDays ?? 0;

  // Botão do WhatsApp com a peça (e o tamanho escolhido) já na mensagem.
  useEffect(() => {
    const ref = product.reference ? ` (Ref. ${product.reference})` : "";
    setWhatsappText(`Oi! Tenho uma dúvida sobre o ${product.name}${ref}${size ? `, tamanho ${size}` : ""}: ${store.siteUrl}/produto/${product.slug}`);
    return () => setWhatsappText(null);
  }, [product.name, product.reference, product.slug, size, store.siteUrl, setWhatsappText]);
  const closeChart = useCallback(() => setChartOpen(false), []);

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
          <div className="product-title-row">
            <h1>{product.name}</h1>
            <FavoriteButton productId={product.id} className="large" />
          </div>
          {product.reference && <div className="product-ref">Ref.: {product.reference}</div>}
          {reviewSummary.total > 0 && (
            <a className="product-rating" href="#avaliacoes">
              <Stars value={reviewSummary.average} /> <small>({reviewSummary.total})</small>
            </a>
          )}
          <PriceRow product={product} />
          <PixPrice product={product} />
          {product.promo && (product.promo.endsAt
            ? <PromoCountdown percent={product.promo.percent} endsAt={product.promo.endsAt} />
            : <div className="promo-note">Promoção de {Math.round(product.promo.percent)}% off</div>)}
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
              {lowStock !== null && (
                <div className="low-stock" role="status">
                  <p>{lowStock === 1 ? <>Última peça no tamanho <strong>{size}</strong></> : <>Últimas <strong>{lowStock}</strong> no tamanho <strong>{size}</strong></>}</p>
                </div>
              )}
            </div>
          )}
          <NotifyMe product={product} />
          {chart && (
            <div className="size-chart">
              <button type="button" className="text-link" aria-haspopup="dialog" onClick={() => setChartOpen(true)}>
                <Icon name="ruler" /> Ver tabela de medidas
              </button>
              {chartOpen && (
                <SizeChartModal
                  chart={chart}
                  size={size}
                  productName={product.name}
                  note={store.commerce.sizeChartNote ?? "Confira as medidas antes de comprar."}
                  onClose={closeChart}
                />
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
                      {photo && <img {...optimized(photo.src, "32px")} alt="" />}
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
          {/* Selos: só regras reais da loja (configuração da loja e painel → Promoções). */}
          <ul className="trust-list">
            {returnDays > 0 && (
              <li><Icon name="swap" /> <span>Troca de tamanho em até {returnDays} dias após receber. <Link href="/institucional/trocas">Ver política de troca</Link></span></li>
            )}
            {promotions.freeShippingMin !== null && <li><Icon name="truck" /> <span>Frete grátis pelo PAC nas compras a partir de {money(promotions.freeShippingMin)}</span></li>}
            {onlinePayments && (
              <li><Icon name="lock" /> <span>Compra 100% segura pelo Mercado Pago: Pix ou cartão{installments > 1 ? ` em até ${installments}x` : ""}. <Link href="/institucional/perguntas">Formas de pagamento</Link></span></li>
            )}
            {store.commerce.shippingNote && <li><Icon name="bag" /> <span>{store.commerce.shippingNote}</span></li>}
          </ul>
          <ProductShipping product={product} />
          <button className="btn btn-light share-btn" type="button" onClick={share}>
            {shared ? "Link copiado!" : "Compartilhar produto"}
          </button>
        </div>
      </div>
      <RelatedProducts product={product} />
      {children}
    </main>
  );
}
