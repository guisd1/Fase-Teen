/*
  Dados estruturados (schema.org em JSON-LD) da página do produto. Com eles o
  Google pode mostrar preço, disponibilidade e estrelas direto no resultado
  da busca e listar o produto na aba Shopping.
*/
import type { Product } from "@/db/products";
import type { Review, ReviewSummary } from "@/db/reviews";
import type { StoreConfig } from "@/stores";

export function productJsonLd(product: Product, summary: ReviewSummary, reviews: Review[], store: StoreConfig) {
  const inStock = product.sizes.length === 0 || product.sizes.some(s => s.stock > 0);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || undefined,
    image: product.images.map(i => i.src),
    sku: product.reference || String(product.id),
    category: product.category || undefined,
    brand: { "@type": "Brand", name: store.name },
    offers: {
      "@type": "Offer",
      url: `${store.siteUrl}/produto/${product.slug}`,
      priceCurrency: "BRL",
      // Preço do site (cartão); o Pix, mais barato, fica na página.
      price: product.price.toFixed(2),
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      // Desistência (art. 49 do CDC): devolução pelo correio, frete de volta pago pela cliente.
      ...(store.commerce.returnDays && {
        hasMerchantReturnPolicy: {
          "@type": "MerchantReturnPolicy",
          applicableCountry: "BR",
          returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
          merchantReturnDays: store.commerce.returnDays,
          returnMethod: "https://schema.org/ReturnByMail",
          returnFees: "https://schema.org/ReturnFeesCustomerResponsibility"
        }
      })
    },
    ...(summary.total > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: summary.average.toFixed(1),
        reviewCount: summary.total
      },
      review: reviews.slice(0, 5).map(r => ({
        "@type": "Review",
        author: { "@type": "Person", name: r.name },
        datePublished: r.createdAt.slice(0, 10),
        reviewBody: r.comment || undefined,
        reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5 }
      }))
    })
  };
}

/** JSON para dentro de <script>: troca "<" para um texto do cadastro não fechar a tag. */
export const jsonLdScript = (data: object) => JSON.stringify(data).replace(/</g, "\\u003c");
