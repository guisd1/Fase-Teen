import { notFound } from "next/navigation";
import { adminCategories, adminGetProduct } from "@/db/products";
import { youtubeConnected } from "@/lib/youtube";
import ProductForm from "@/components/admin/ProductForm";
import { getPaymentFees } from "@/db/settings";
import { blobMode } from "@/lib/blob";
import { deleteProduct, duplicateProduct } from "../../../actions";
import DeleteButton from "@/components/admin/DeleteButton";

export default async function EditProductPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ copia?: string }> }) {
  const copy = (await searchParams).copia === "1";
  const id = Number((await params).id);
  const product = Number.isInteger(id) ? await adminGetProduct(id) : null;
  if (!product) notFound();
  const [categories, ytConnected] = await Promise.all([adminCategories(), youtubeConnected()]);

  return (
    <>
      <div className="admin-head">
        <h1>{product.name}</h1>
        <div className="admin-head-actions">
          <form action={duplicateProduct.bind(null, product.id)}><button className="btn btn-light" type="submit">Duplicar</button></form>
          <DeleteButton action={deleteProduct.bind(null, product.id)} />
        </div>
      </div>
      {copy && <p className="admin-alert">Esta é uma cópia, criada <strong>inativa</strong>. Ajuste o nome, as cores, as fotos e o estoque, marque &quot;Ativo&quot; e salve.</p>}
      <ProductForm id={product.id} initial={product} categories={categories} youtubeConnected={ytConnected} blobMode={blobMode()} fees={await getPaymentFees()} />
    </>
  );
}
