import type { Product } from "@/db/products";
import type { ProductImage } from "@/db/schema";
import { youtubeId } from "./youtube-id";

/**
 * Fotos a exibir para a cor escolhida: primeiro as fotos dessa cor, depois as
 * fotos gerais (sem cor). Se a cor não tiver foto própria, mostra todas.
 */
export function imagesForColor(images: ProductImage[], color?: string | null): ProductImage[] {
  if (!color || !images.some(i => i.color === color)) return images;
  return [...images.filter(i => i.color === color), ...images.filter(i => !i.color)];
}

/** Foto principal do produto (da cor escolhida, se houver), ou a capa do vídeo. */
export function mainImage(p: Pick<Product, "images" | "youtubeUrl">, color?: string | null) {
  const video = youtubeId(p.youtubeUrl);
  return imagesForColor(p.images, color)[0]?.src ?? (video ? `https://i.ytimg.com/vi/${video}/hqdefault.jpg` : "");
}
