import crypto from "node:crypto";
import { getStore } from "@/stores";
import { getRedis, storeKey } from "./redis";

/*
  Envio de vídeos para o canal da loja pela YouTube Data API.
  Variáveis na Vercel (cada loja com o próprio projeto no Google Cloud):
    GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
  A autorização é feita uma vez pelo painel (Integrações → Conectar YouTube)
  e o refresh token fica salvo no Redis.
*/

const SCOPE = "https://www.googleapis.com/auth/youtube.upload";

/** Lê a variável tolerando espaços, aspas e o nome colado junto (ex.: "GOOGLE_CLIENT_ID=123..."). */
function googleEnv(name: "GOOGLE_CLIENT_ID" | "GOOGLE_CLIENT_SECRET") {
  const unquote = (v: string) => v.trim().replace(/^["']+|["']+$/g, "").trim();
  return unquote(unquote(process.env[name] ?? "").replace(new RegExp(`^${name}\\s*=`), ""));
}
const clientId = () => googleEnv("GOOGLE_CLIENT_ID");
const clientSecret = () => googleEnv("GOOGLE_CLIENT_SECRET");
const tokenKey = () => storeKey("youtube:tokens");
const statePrefix = () => storeKey("youtube:oauth-state:");

interface SavedTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export function youtubeConfigured() {
  return Boolean(clientId() && clientSecret());
}

/** Falso quando o GOOGLE_CLIENT_ID não parece um ID de cliente OAuth (ex.: colaram a chave secreta no lugar). */
export function youtubeClientIdLooksValid() {
  return clientId().endsWith(".apps.googleusercontent.com");
}

export function getYoutubeRedirectUri() {
  return `${getStore().siteUrl}/api/youtube/callback`;
}

export async function youtubeAuthorizeUrl() {
  const state = crypto.randomBytes(24).toString("hex");
  await getRedis().set(`${statePrefix()}${state}`, "1", { ex: 600 });
  const params = new URLSearchParams({
    client_id: clientId(),
    redirect_uri: getYoutubeRedirectUri(),
    response_type: "code",
    scope: SCOPE,
    access_type: "offline",
    // Sempre mostra a escolha de conta: quem tem várias contas Google escolhe a do canal da loja.
    prompt: "select_account consent",
    include_granted_scopes: "true",
    state
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function consumeYoutubeState(state: string) {
  const redis = getRedis();
  const key = `${statePrefix()}${state}`;
  const found = await redis.get(key);
  if (!found) return false;
  await redis.del(key);
  return true;
}

async function requestToken(body: Record<string, string>) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      ...body,
      client_id: clientId(),
      client_secret: clientSecret()
    })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || `O Google recusou a autorização (${response.status}).`);
  }
  return data as { access_token: string; refresh_token?: string; expires_in?: number };
}

export async function exchangeYoutubeCode(code: string) {
  const data = await requestToken({ grant_type: "authorization_code", code, redirect_uri: getYoutubeRedirectUri() });
  if (!data.refresh_token) {
    throw new Error("O Google não devolveu o refresh token. Remova o acesso do app em myaccount.google.com/permissions e conecte de novo.");
  }
  const saved: SavedTokens = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + Number(data.expires_in || 3600) * 1000
  };
  await getRedis().set(tokenKey(), saved);
}

export async function youtubeConnected() {
  try {
    return Boolean((await getRedis().get<SavedTokens>(tokenKey()))?.refresh_token);
  } catch {
    return false;
  }
}

export async function disconnectYoutube() {
  await getRedis().del(tokenKey());
}

async function getAccessToken() {
  const current = await getRedis().get<SavedTokens>(tokenKey());
  if (!current?.refresh_token) throw new Error("YouTube não conectado. Conecte em Integrações.");
  if (current.expires_at > Date.now() + 60_000) return current.access_token;
  const data = await requestToken({ grant_type: "refresh_token", refresh_token: current.refresh_token });
  const renewed: SavedTokens = {
    access_token: data.access_token,
    refresh_token: data.refresh_token || current.refresh_token,
    expires_at: Date.now() + Number(data.expires_in || 3600) * 1000
  };
  await getRedis().set(tokenKey(), renewed);
  return renewed.access_token;
}

export interface VideoDetails {
  title: string;
  description: string;
  tags: string[];
  privacy: "public" | "unlisted" | "private";
  madeForKids: boolean;
  size: number;
  mimeType: string;
}

/**
 * Cria uma sessão de upload retomável. O navegador envia o arquivo direto
 * para a URL devolvida, sem passar pelo servidor (evita o limite de tamanho da Vercel).
 */
export async function createUploadSession(video: VideoDetails, origin: string) {
  const token = await getAccessToken();
  const response = await fetch(
    "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Length": String(video.size),
        "X-Upload-Content-Type": video.mimeType,
        // Libera o navegador (CORS) a enviar o arquivo para a URL de upload.
        "Origin": origin
      },
      body: JSON.stringify({
        snippet: { title: video.title, description: video.description, tags: video.tags, categoryId: "26" },
        status: { privacyStatus: video.privacy, embeddable: true, selfDeclaredMadeForKids: video.madeForKids }
      })
    }
  );
  const uploadUrl = response.headers.get("location");
  if (!response.ok || !uploadUrl) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.error?.message || `O YouTube recusou o envio (${response.status}).`);
  }
  return uploadUrl;
}

export async function setThumbnail(videoId: string, image: Blob) {
  const token = await getAccessToken();
  const response = await fetch(
    `https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${encodeURIComponent(videoId)}&uploadType=media`,
    { method: "POST", headers: { "Authorization": `Bearer ${token}`, "Content-Type": image.type }, body: image }
  );
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.error?.message || `O YouTube recusou a capa (${response.status}).`);
  }
}
