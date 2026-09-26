"use client";

import type { Product } from "@/db/products";
import ProductCard, { soldOut } from "./ProductCard";
import { useShop } from "./ShopShell";

/** "Complete o look": peças da mesma categoria primeiro, depois os destaques. */
export default function RelatedProducts({ product }: { product: Product }) {
  const { store, products } = useShop();
  const score = (p: Product) => (p.category && p.category === product.category ? 2 : 0) + (p.featured ? 1 : 0) - (soldOut(p) ? 3 : 0);
  const related = products
    .filter(p => p.id !== product.id)
    .sort((a, b) => score(b) - score(a))
    .slice(0, 4);
  if (!related.length) return null;
  return (
    <section className="related">
      <div className="section-head">
        <div>
          <p className="eyebrow">VOCÊ TAMBÉM VAI GOSTAR</p>
          <h2>Complete o look</h2>
        </div>
      </div>
      <div className="product-grid">
        {related.map(p => <ProductCard key={p.id} product={p} installments={store.commerce.installments} />)}
      </div>
    </section>
  );
}
