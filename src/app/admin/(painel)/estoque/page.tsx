import { adminListProducts } from "@/db/products";
import { mainImage } from "@/lib/product-media";
import StockEditor from "@/components/admin/StockEditor";

export default async function StockPage() {
  const products = (await adminListProducts()).filter(p => p.sizes.length > 0);
  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Estoque</h1>
          <p>Altere o estoque de vários produtos e salve de uma vez. Em laranja, tamanhos com 1 ou 2 peças; em vermelho, esgotados.</p>
        </div>
      </div>
      {products.length === 0
        ? <div className="admin-empty"><p>Nenhum produto com tamanhos cadastrados.</p></div>
        : <StockEditor initial={products.map(p => ({ id: p.id, name: p.name, image: mainImage(p) || null, sizes: p.sizes }))} />}
    </>
  );
}
