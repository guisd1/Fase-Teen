import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getProduct, getProducts } from "@/db/products";
import { getStore } from "@/stores";
import ProductDetail from "@/components/ProductDetail";
import { mainImage } from "@/lib/product-media";
import { blobMode } from "@/lib/blob";
// Fotos nas avaliações precisam do Redis (limite de envios por IP).
import { hasRedis } from "@/lib/redis";
import { getProductReviews } from "@/db/reviews";
import ProductReviews from "@/components/ProductReviews";

export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string }>;
}

const idFrom = (slug: string) => Number.parseInt(slug, 10);

export async function generateStaticParams() {
  return (await getProducts()).map(p => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct(idFrom((await params).slug));
  if (!product) return {};
  const store = getStore();
  const image = mainImage(product);
  return {
    title: `${product.name} | ${store.name}`,
    description: product.description || store.meta.description,
    // Prévia bonita ao compartilhar o link no WhatsApp/Instagram.
    openGraph: { title: product.name, description: product.description, images: image ? [image] : [] }
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProduct(idFrom(slug));
  if (!product) notFound();
  // Mantém o link certo mesmo se o nome do produto mudar.
  if (slug !== product.slug) permanentRedirect(`/produto/${product.slug}`);
  const { reviews, summary } = await getProductReviews(product.id);
  return (
    <ProductDetail product={product} reviewSummary={summary}>
      <ProductReviews productId={product.id} reviews={reviews} summary={summary} blobMode={hasRedis() ? blobMode() : null} />
    </ProductDetail>
  );
}
