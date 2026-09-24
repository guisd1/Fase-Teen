"use client";

import { useState } from "react";
import type { Product } from "@/db/products";
import type { CartItem } from "./useCart";
import MediaCarousel from "./MediaCarousel";
import { PriceRow } from "./ProductCard";

export default function ProductModal({ product, onClose, onAdd }: {
  product: Product;
  onClose: () => void;
  onAdd: (item: CartItem) => void;
}) {
  const [size, setSize] = useState(product.sizes[0] ?? "");
  const [color, setColor] = useState(product.colors[0] ?? "");

  return (
    <div className="modal" role="dialog" aria-modal="true" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <button className="modal-close" type="button" onClick={onClose}>×</button>
      <div>
        <div className="quick-product">
          <MediaCarousel product={product} className="modal-media" />
          <div className="quick-info">
            <div className="product-category">{product.category}</div>
            <h2>{product.name}</h2>
            {product.reference && <div className="product-ref">Ref.: {product.reference}</div>}
            <PriceRow product={product} />
            <p className="quick-desc">{product.description}</p>
            {product.composition && (
              <div className="option-row">
                <span>COMPOSIÇÃO / DETALHES</span>
                <p className="quick-composition">{product.composition}</p>
              </div>
            )}
            <div className="option-row">
              <span>TAMANHO</span>
              <div className="option-chips">
                {product.sizes.map(s => (
                  <button key={s} type="button" className={`option-chip ${s === size ? "active" : ""}`} onClick={() => setSize(s)}>{s}</button>
                ))}
              </div>
            </div>
            <div className="option-row">
              <span>COR</span>
              <div className="option-chips">
                {product.colors.map(c => (
                  <button key={c} type="button" className={`option-chip ${c === color ? "active" : ""}`} onClick={() => setColor(c)}>{c}</button>
                ))}
              </div>
            </div>
            <button className="btn btn-dark quick-buy" type="button" onClick={() => onAdd({ id: product.id, size, color, qty: 1 })}>
              Adicionar ao carrinho
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
