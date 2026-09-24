import type { ReactNode } from "react";
import { getProducts } from "@/db/products";
import { getStore } from "@/stores";
import ShopShell from "@/components/ShopShell";

// Recarrega os produtos do banco no máximo a cada 60 segundos
// (o painel também força a atualização ao salvar um produto).
export const revalidate = 60;

export default async function ShopLayout({ children }: { children: ReactNode }) {
  const store = getStore();
  const products = await getProducts();
  return <ShopShell store={store} products={products}>{children}</ShopShell>;
}
