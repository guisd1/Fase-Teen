import { adminCategories } from "@/db/products";
import { youtubeConnected } from "@/lib/youtube";
import ProductForm from "@/components/admin/ProductForm";

export default async function NewProductPage() {
  const [categories, ytConnected] = await Promise.all([adminCategories(), youtubeConnected()]);
  return (
    <>
      <div className="admin-head"><h1>Novo produto</h1></div>
      <ProductForm id={null} initial={null} categories={categories} youtubeConnected={ytConnected} />
    </>
  );
}
