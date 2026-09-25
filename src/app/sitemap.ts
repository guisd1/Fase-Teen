import type { MetadataRoute } from "next";
import { getProducts } from "@/db/products";
import { getStore } from "@/stores";

// Produtos novos entram no sitemap em até 1 hora.
export const revalidate = 3600;

/** /sitemap.xml: página inicial, produtos ativos (com as fotos) e páginas institucionais. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const store = getStore();
  const url = (path: string) => `${store.siteUrl}${path}`;
  const products = await getProducts();
  return [
    { url: url("/"), changeFrequency: "daily", priority: 1 },
    ...products.map(p => ({
      url: url(`/produto/${p.slug}`),
      changeFrequency: "weekly" as const,
      priority: 0.8,
      // Ajuda as fotos a aparecerem no Google Imagens.
      images: p.images.map(i => i.src).slice(0, 10)
    })),
    ...Object.keys(store.pages).map(slug => ({
      url: url(`/institucional/${slug}`),
      changeFrequency: "yearly" as const,
      priority: 0.3
    }))
  ];
}
