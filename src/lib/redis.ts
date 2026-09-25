import { Redis } from "@upstash/redis";
import { getStore } from "@/stores";

const redisUrl = () => process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const redisToken = () => process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

export const hasRedis = () => Boolean(redisUrl() && redisToken());

export function getRedis() {
  const url = redisUrl();
  const token = redisToken();
  if (!url || !token) {
    throw new Error("Upstash Redis não configurado. Conecte o Redis ao projeto na Vercel e faça o deploy novamente.");
  }
  return new Redis({ url, token, enableTelemetry: false });
}

/** As chaves levam o id da loja, então várias lojas podem dividir o mesmo Redis sem conflito. */
export const storeKey = (key: string) => `${getStore().id}:${key}`;

/**
 * Limita quantas vezes o mesmo IP pode usar uma rota pública (ex.: 10 pedidos por hora).
 * Devolve true quando o limite foi passado. Sem Redis, `failClosed` decide: bloquear ou deixar passar.
 */
export async function rateLimited(request: Request, name: string, max: number, windowSeconds: number, failClosed = false) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  try {
    const redis = getRedis();
    const key = storeKey(`rate:${name}:${ip}`);
    const hits = await redis.incr(key);
    if (hits === 1) await redis.expire(key, windowSeconds);
    return hits > max;
  } catch {
    return failClosed;
  }
}
