import Link from "next/link";
import { adminListProducts } from "@/db/products";
import { mainImage } from "@/lib/product-media";
import ProductOrder from "@/components/admin/ProductOrder";

export default async function ProductOrderPage() {
  const products = await adminListProducts();
  return (
    <>
      <p><Link href="/admin/produtos">← Produtos</Link></p>
      <div className="admin-head">
        <div>
          <h1>Ordem da vitrine</h1>
          <p>Arraste os produtos (ou use as setas) para escolher a ordem em que aparecem no site. O primeiro da lista aparece primeiro. Produtos novos entram no topo.</p>
        </div>
      </div>
      <ProductOrder initial={products.map(p => ({ id: p.id, name: p.name, image: mainImage(p) || null, active: p.active }))} />
    </>
  );
}
