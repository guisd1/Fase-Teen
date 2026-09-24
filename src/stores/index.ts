import type { StoreConfig } from "./types";
import faseTeen from "./fase-teen";
import cirandaCirandinha from "./ciranda-cirandinha";

/*
  Para adicionar uma nova loja: crie src/stores/<id>.ts seguindo o
  formato de StoreConfig e registre abaixo. Cada projeto na Vercel
  escolhe a loja pela variável de ambiente STORE.
*/
const stores: Record<string, StoreConfig> = {
  [faseTeen.id]: faseTeen,
  [cirandaCirandinha.id]: cirandaCirandinha
};

const DEFAULT_STORE = faseTeen.id;

export function getStore(): StoreConfig {
  const id = process.env.STORE?.trim() || DEFAULT_STORE;
  const store = stores[id];
  if (!store) {
    throw new Error(`STORE="${id}" não existe. Valores aceitos: ${Object.keys(stores).join(", ")}.`);
  }
  return {
    ...store,
    siteUrl: (process.env.SITE_URL?.trim() || store.siteUrl).replace(/\/+$/, "")
  };
}

export type { StoreConfig } from "./types";
