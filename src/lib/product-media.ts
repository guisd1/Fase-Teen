import type { Product } from "@/db/products";
import { youtubeId } from "./youtube-id";

/** Foto principal do produto (ou a capa do vídeo, se não houver foto). */
export function mainImage(p: Pick<Product, "images" | "youtubeUrl">) {
  const video = youtubeId(p.youtubeUrl);
  return p.images[0]?.src ?? (video ? `https://i.ytimg.com/vi/${video}/hqdefault.jpg` : "");
}
