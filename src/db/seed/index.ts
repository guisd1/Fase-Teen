import type { NewProductRow } from "../schema";
import faseTeen from "./fase-teen";
import cirandaCirandinha from "./ciranda-cirandinha";

const seeds: Record<string, NewProductRow[]> = {
  "fase-teen": faseTeen,
  "ciranda-cirandinha": cirandaCirandinha
};

export function getSeed(storeId: string): NewProductRow[] {
  return seeds[storeId] ?? [];
}
