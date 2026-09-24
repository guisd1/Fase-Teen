import crypto from "node:crypto";
import { getStore } from "@/stores";
import { getRedis, storeKey } from "./redis";

export const ME_URL = "https://melhorenvio.com.br";

interface SavedTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_at: number;
  refresh_expires_at: number;
}

interface TokenResponse {
  access_token?: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
  message?: string;
  error?: string;
}

const tokenKey = () => storeKey("melhor-envio:tokens");
const statePrefix = () => storeKey("melhor-envio:oauth-state:");

export function getUserAgent() {
  return process.env.MELHOR_ENVIO_USER_AGENT || `${getStore().name} (contato técnico)`;
}

export function getRedirectUri() {
  return `${getStore().siteUrl}/api/melhor-envio/callback`;
}

export function getClientId() {
  return process.env.MELHOR_ENVIO_CLIENT_ID || "";
}

export async function createOAuthState() {
  const state = crypto.randomBytes(32).toString("hex");
  await getRedis().set(`${statePrefix()}${state}`, "1", { ex: 600 });
  return state;
}

export async function consumeOAuthState(state: string) {
  const redis = getRedis();
  const key = `${statePrefix()}${state}`;
  const found = await redis.get(key);
  if (!found) return false;
  await redis.del(key);
  return true;
}

async function saveTokens(tokens: TokenResponse): Promise<SavedTokens> {
  const saved: SavedTokens = {
    access_token: tokens.access_token!,
    refresh_token: tokens.refresh_token!,
    token_type: tokens.token_type || "Bearer",
    expires_at: Date.now() + Number(tokens.expires_in || 2592000) * 1000,
    refresh_expires_at: Date.now() + 45 * 24 * 60 * 60 * 1000
  };
  await getRedis().set(tokenKey(), saved);
  return saved;
}

async function readTokens() {
  return await getRedis().get<SavedTokens>(tokenKey());
}

export async function melhorEnvioStatus(): Promise<"connected" | "expired" | "disconnected" | "no-redis"> {
  try {
    const t = await readTokens();
    if (!t?.refresh_token) return "disconnected";
    return Number(t.refresh_expires_at) < Date.now() ? "expired" : "connected";
  } catch {
    return "no-redis";
  }
}

async function requestToken(body: Record<string, string>) {
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
      redirect_uri: getRedirectUri()
    })
  });

  const data: TokenResponse = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || data?.error || `Melhor Envio recusou a autenticação (${response.status}).`);
  }
  if (!data?.access_token || !data?.refresh_token) {
    throw new Error("O Melhor Envio não retornou access_token e refresh_token.");
  }
  return data;
}

export async function exchangeCode(code: string) {
  return saveTokens(await requestToken({ grant_type: "authorization_code", code }));
}

async function refreshAccessToken() {
  const current = await readTokens();
  if (!current?.refresh_token) {
    throw new Error(`A ${getStore().name} ainda não autorizou o Melhor Envio. Abra /api/melhor-envio/authorize.`);
  }
  if (current.refresh_expires_at && Number(current.refresh_expires_at) < Date.now()) {
    throw new Error("A autorização do Melhor Envio expirou. Abra /api/melhor-envio/authorize novamente.");
  }
  return saveTokens(await requestToken({ grant_type: "refresh_token", refresh_token: current.refresh_token }));
}

export async function getAccessToken(forceRefresh = false) {
  const current = await readTokens();
  if (!current?.access_token || !current?.refresh_token) {
    throw new Error("Frete ainda não conectado ao Melhor Envio. Abra /api/melhor-envio/authorize para autorizar a conta.");
  }
  const notExpired = Number(current.expires_at || 0) > Date.now() + 60_000;
  if (!forceRefresh && notExpired) return current.access_token;
  return (await refreshAccessToken()).access_token;
}
