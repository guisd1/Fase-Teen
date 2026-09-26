import { getImageProps } from "next/image";

/*
  Fotos do Vercel Blob passam pelo otimizador de imagens do Next.js: o
  navegador recebe WebP no tamanho certo para a tela (uma foto PNG de 2 MB
  vira algo como 60–150 KB). Outras imagens (YouTube, /brand) ficam como estão.
*/
export function optimized(src: string, sizes: string) {
  if (!src.includes(".blob.vercel-storage.com/")) return { src };
  const { props } = getImageProps({ src, alt: "", fill: true, sizes, quality: 75 });
  return { src: props.src, srcSet: props.srcSet, sizes: props.sizes };
}
