import type { ProductSize } from "@/db/schema";

/**
  Confere se há peças suficientes em cada tamanho pedido (somando linhas repetidas).
  Produto sem tamanhos cadastrados não tem limite. Devolve a mensagem para a cliente, ou null se está tudo certo.
*/
export function stockProblem(
  items: { productId: number; size: string; qty: number }[],
  catalog: { id: number; name: string; sizes: ProductSize[] }[]
): string | null {
  const wanted = new Map<string, { productId: number; size: string; qty: number }>();
  for (const i of items) {
    const key = `${i.productId}|${i.size}`;
    const line = wanted.get(key);
    if (line) line.qty += i.qty;
    else wanted.set(key, { ...i });
  }
  for (const { productId, size, qty } of wanted.values()) {
    const product = catalog.find(p => p.id === productId);
    if (!product?.sizes.length) continue;
    const stock = Math.max(0, product.sizes.find(s => s.size === size)?.stock ?? 0);
    if (qty <= stock) continue;
    const what = `${product.name}${size ? ` (tamanho ${size})` : ""}`;
    return stock === 0
      ? `${what} acabou de esgotar. Remova do carrinho para continuar.`
      : `${what}: só ${stock === 1 ? "resta 1 peça" : `restam ${stock} peças`}. Diminua a quantidade no carrinho para continuar.`;
  }
  return null;
}
