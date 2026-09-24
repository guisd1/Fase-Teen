"use client";

import type { Product } from "@/db/products";
import { money } from "@/lib/format";
import MediaCarousel from "./MediaCarousel";

export function PriceRow({ product }: { product: Product }) {
  return (
    <div className="price-row">
      <span className="price">{money(product.price)}</span>
      {product.oldPrice ? <span className="old-price">{money(product.oldPrice)}</span> : null}
    </div>
  );
}

export default function ProductCard({ product, installments, onOpen }: {
  product: Product;
  installments: number;
  onOpen: (p: Product) => void;
}) {
  return (
    <article className="product-card">
      <MediaCarousel product={product}>
        {product.badge && <span className="badge">{product.badge}</span>}
        <button className="quick-view" type="button" onClick={() => onOpen(product)}>Ver produto</button>
      </MediaCarousel>
      <div className="product-info">
        <div className="product-category">{product.category}</div>
        <h3>{product.name}</h3>
        {product.reference && <div className="product-ref">Ref.: {product.reference}</div>}
        <PriceRow product={product} />
        {installments > 1 && (
          <div className="installment">ou {installments}x de {money(product.price / installments)}*</div>
        )}
      </div>
    </article>
  );
}
