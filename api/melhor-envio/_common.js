import crypto from "node:crypto";
import { Redis } from "@upstash/redis";

const REDIRECT_URI = "https://fase-teen.vercel.app/api/melhor-envio/callback";
const ME_URL = "https://melhorenvio.com.br";
const TOKEN_KEY = "fase-teen:melhor-envio:tokens";
const STATE_PREFIX = "fase-teen:melhor-envio:oauth-state:";

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) {
    throw new Error("Upstash Redis não configurado. Instale o Redis do Vercel Marketplace e faça o deploy novamente.");
  }
  return new Redis({ url, token, enableTelemetry: false });
}

export function getUserAgent() {
  return process.env.MELHOR_ENVIO_USER_AGENT || "Fase Teen (contato técnico)";
}

export function getRedirectUri() {
  return REDIRECT_URI;
}

export function getClientId() {
  return process.env.MELHOR_ENVIO_CLIENT_ID || "";
}

export async function createOAuthState() {
  const redis = getRedis();
  const state = crypto.randomBytes(32).toString("hex");
  await redis.set(`${STATE_PREFIX}${state}`, "1", { ex: 600 });
  return state;
}

export async function consumeOAuthState(state) {
  const redis = getRedis();
  const key = `${STATE_PREFIX}${String(state || "")}`;
  const found = await redis.get(key);
  if (!found) return false;
  await redis.del(key);
  return true;
}

export async function saveTokens(tokens) {
  const redis = getRedis();
  const saved = {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    token_type: tokens.token_type || "Bearer",
    expires_at: Date.now() + Number(tokens.expires_in || 2592000) * 1000,
    refresh_expires_at: Date.now() + 45 * 24 * 60 * 60 * 1000
  };
  await redis.set(TOKEN_KEY, saved);
  return saved;
}

export async function readTokens() {
  const redis = getRedis();
  return await redis.get(TOKEN_KEY);
}

async function requestToken(body) {
  const clientId = getClientId();
  const clientSecret = process.env.MELHOR_ENVIO_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Credenciais do aplicativo do Melhor Envio não configuradas na Vercel.");
  }

  const response = await fetch(`${ME_URL}/oauth/token`, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": getUserAgent()
    },
    body: new URLSearchParams({
      ...body,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: REDIRECT_URI
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || data?.error || `Melhor Envio recusou a autenticação (${response.status}).`);
  }
  if (!data?.access_token || !data?.refresh_token) {
    throw new Error("O Melhor Envio não retornou access_token e refresh_token.");
  }
  return data;
}

export async function exchangeCode(code) {
  const tokens = await requestToken({
    grant_type: "authorization_code",
    code: String(code)
  });
  return saveTokens(tokens);
}

export async function refreshAccessToken() {
  const current = await readTokens();
  if (!current?.refresh_token) {
    throw new Error("A Fase Teen ainda não autorizou o Melhor Envio. Abra /api/melhor-envio/authorize.");
  }

  if (current.refresh_expires_at && Number(current.refresh_expires_at) < Date.now()) {
    throw new Error("A autorização do Melhor Envio expirou. Abra /api/melhor-envio/authorize novamente.");
  }

  const tokens = await requestToken({
    grant_type: "refresh_token",
    refresh_token: current.refresh_token
  });
  return saveTokens(tokens);
}

export async function getAccessToken(forceRefresh = false) {
  const current = await readTokens();
  if (!current?.access_token || !current?.refresh_token) {
    throw new Error("Frete ainda não conectado ao Melhor Envio. Abra /api/melhor-envio/authorize para autorizar a conta.");
  }

  const notExpired = Number(current.expires_at || 0) > Date.now() + 60_000;
  if (!forceRefresh && notExpired) return current.access_token;

  const renewed = await refreshAccessToken();
  return renewed.access_token;
}

export { ME_URL, TOKEN_KEY };
