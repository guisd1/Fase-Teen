import { Redis } from "@upstash/redis";
import { getStore } from "@/stores";

export function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) {
    throw new Error("Upstash Redis não configurado. Conecte o Redis ao projeto na Vercel e faça o deploy novamente.");
  }
  return new Redis({ url, token, enableTelemetry: false });
}

/** As chaves levam o id da loja, então várias lojas podem dividir o mesmo Redis sem conflito. */
export const storeKey = (key: string) => `${getStore().id}:${key}`;
