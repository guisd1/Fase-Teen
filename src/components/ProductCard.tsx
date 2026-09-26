"use client";

import Link from "next/link";
import type { Product } from "@/db/products";
import { money } from "@/lib/format";
import MediaCarousel from "./MediaCarousel";
import { track } from "@/lib/track";
import FavoriteButton from "./FavoriteButton";

export const soldOut = (p: Product) => p.sizes.length > 0 && p.sizes.every(s => s.stock <= 0);

export function PriceRow({ product }: { product: Product }) {
  return (
    <div className="price-row">
      <span className="price">{money(product.price)}</span>
      {product.oldPrice && product.oldPrice > product.price ? <span className="old-price">{money(product.oldPrice)}</span> : null}
    </div>
  );
}

/** "ou R$ X no Pix" — só aparece quando o Pix sai mais barato (Mercado Pago ativo). */
export function PixPrice({ product }: { product: Product }) {
  if (!(product.pixPrice < product.price)) return null;
  return <div className="pix-price">ou <strong>{money(product.pixPrice)}</strong> no Pix</div>;
}

export default function ProductCard({ product, installments }: { product: Product; installments: number }) {
  const href = `/produto/${product.slug}`;
  const badge = soldOut(product) ? "ESGOTADO" : product.promo ? `-${Math.round(product.promo.percent)}%` : product.badge;
  const clicked = () => track("click", product.id);
  return (
    <article className="product-card">
      <MediaCarousel product={product}>
        {badge && <span className="badge">{badge}</span>}
        <FavoriteButton productId={product.id} />
        <Link className="quick-view" href={href} onClick={clicked}>Ver produto</Link>
      </MediaCarousel>
      <div className="product-info">
        {product.category && <div className="product-category">{product.category}</div>}
        <h3><Link href={href} onClick={clicked}>{product.name}</Link></h3>
        {product.reference && <div className="product-ref">Ref.: {product.reference}</div>}
        <PriceRow product={product} />
        <PixPrice product={product} />
        {installments > 1 && (
          <div className="installment">ou {installments}x de {money(product.price / installments)}*</div>
        )}
      </div>
    </article>
  );
}
