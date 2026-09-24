"use client";

import { useState } from "react";
import Link from "next/link";
import type { Product } from "@/db/products";
import { money } from "@/lib/format";
import MediaCarousel from "./MediaCarousel";
import { PriceRow, soldOut } from "./ProductCard";
import { useShop } from "./ShopShell";

export default function ProductDetail({ product }: { product: Product }) {
  const { store, cart, openCart } = useShop();
  const firstAvailable = product.sizes.find(s => s.stock > 0)?.size ?? "";
  const [size, setSize] = useState(firstAvailable);
  const [color, setColor] = useState(product.colors[0] ?? "");
  const [shared, setShared] = useState(false);
  const outOfStock = soldOut(product);
  const installments = store.commerce.installments;

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: product.name, url });
      else { await navigator.clipboard.writeText(url); setShared(true); }
    } catch { /* compartilhamento cancelado */ }
  };

  return (
    <main className="product-page">
      <nav className="breadcrumb">
        <Link href="/">Início</Link> / <Link href="/#colecao">{product.category || "Coleção"}</Link> / <span>{product.name}</span>
      </nav>
      <div className="quick-product">
        {/* key: volta para a primeira foto ao trocar de cor */}
        <MediaCarousel key={color} product={product} color={color} className="modal-media" playVideo />
        <div className="quick-info">
          {product.category && <div className="product-category">{product.category}</div>}
          <h1>{product.name}</h1>
          {product.reference && <div className="product-ref">Ref.: {product.reference}</div>}
          <PriceRow product={product} />
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
            onClick={() => { cart.addToCart({ id: product.id, size, color, qty: 1 }); openCart(); }}
          >
            {outOfStock ? "Esgotado" : "Adicionar ao carrinho"}
          </button>
          <button className="btn btn-light share-btn" type="button" onClick={share}>
            {shared ? "Link copiado!" : "Compartilhar produto"}
          </button>
        </div>
      </div>
    </main>
  );
}
