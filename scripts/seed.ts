/*
  Grava os produtos iniciais da loja definida em STORE no banco de DATABASE_URL.
  Só grava se a tabela estiver vazia, para nunca duplicar produtos.

  Uso: STORE=fase-teen npm run db:seed   (lê também o arquivo .env.local)
*/
import { getStore } from "../src/stores";
import { getSeed } from "../src/db/seed";
import { countProducts, insertProducts } from "../src/db/products";

async function main() {
  const store = getStore();
  const existing = await countProducts();
  if (existing > 0) {
    console.log(`[${store.id}] O banco já tem ${existing} produto(s). Nada foi gravado.`);
    return;
  }
  const seed = getSeed(store.id).map((p, index) => ({ ...p, sortOrder: index }));
  const inserted = await insertProducts(seed);
  console.log(`[${store.id}] ${inserted} produto(s) gravado(s).`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
