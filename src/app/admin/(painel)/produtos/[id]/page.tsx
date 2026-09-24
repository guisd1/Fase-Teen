import { notFound } from "next/navigation";
import { adminCategories, adminGetProduct } from "@/db/products";
import { youtubeConnected } from "@/lib/youtube";
import ProductForm from "@/components/admin/ProductForm";
import { blobMode } from "@/lib/blob";
import { deleteProduct } from "../../../actions";
import DeleteButton from "@/components/admin/DeleteButton";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const product = Number.isInteger(id) ? await adminGetProduct(id) : null;
  if (!product) notFound();
  const [categories, ytConnected] = await Promise.all([adminCategories(), youtubeConnected()]);

  return (
    <>
      <div className="admin-head">
        <h1>{product.name}</h1>
        <DeleteButton action={deleteProduct.bind(null, product.id)} />
      </div>
      <ProductForm id={product.id} initial={product} categories={categories} youtubeConnected={ytConnected} blobMode={blobMode()} />
    </>
  );
}
