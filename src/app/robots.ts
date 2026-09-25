import type { MetadataRoute } from "next";
import { getStore } from "@/stores";

/** /robots.txt: libera a loja e esconde o painel, as APIs e as páginas de pedido. */
export default function robots(): MetadataRoute.Robots {
  const { siteUrl } = getStore();
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/pedido/"] },
    sitemap: `${siteUrl}/sitemap.xml`
  };
}
