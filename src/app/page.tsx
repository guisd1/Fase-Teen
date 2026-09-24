import { getProducts } from "@/db/products";
import { getStore } from "@/stores";
import Storefront from "@/components/Storefront";

// Recarrega os produtos do banco no máximo a cada 60 segundos.
export const revalidate = 60;

export default async function Home() {
  const store = getStore();
  const products = await getProducts();
  return <Storefront store={store} products={products} />;
}
