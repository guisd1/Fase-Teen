import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/*
  Login do painel: um único administrador por loja, definido nas variáveis
  de ambiente do projeto na Vercel (cada loja tem o seu):
    ADMIN_EMAIL           e-mail de acesso
    ADMIN_PASSWORD_HASH   gerado com `npm run admin:hash -- "sua senha"`
    ADMIN_SESSION_SECRET  texto aleatório (o mesmo comando gera um)
*/

const COOKIE = "admin_session";
const SESSION_DAYS = 7;

/**
 * Lê a variável tolerando erros comuns ao colar na Vercel:
 * espaços, aspas e o nome da variável junto (ex.: "ADMIN_PASSWORD_HASH=scrypt:...").
 */
function env(name: "ADMIN_EMAIL" | "ADMIN_PASSWORD_HASH" | "ADMIN_SESSION_SECRET") {
  const unquote = (v: string) => v.trim().replace(/^["']+|["']+$/g, "").trim();
  return unquote(unquote(process.env[name] ?? "").replace(new RegExp(`^${name}\\s*=`), ""));
}

function secret() {
  const s = env("ADMIN_SESSION_SECRET");
  if (s.length < 32) throw new Error("ADMIN_SESSION_SECRET ausente ou curto demais (mínimo 32 caracteres).");
  return s;
}

/** Falso quando ADMIN_PASSWORD_HASH não é um hash gerado pelo `npm run admin:hash` (ex.: a senha pura). */
export function adminHashValid() {
  return /^scrypt:[0-9a-f]{32}:[0-9a-f]{128}$/.test(env("ADMIN_PASSWORD_HASH"));
}

export function adminConfigured() {
  return Boolean(env("ADMIN_EMAIL") && env("ADMIN_PASSWORD_HASH") && env("ADMIN_SESSION_SECRET"));
}

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return `scrypt:${salt.toString("hex")}:${hash.toString("hex")}`;
}

function verifyPassword(password: string, stored: string) {
  const [scheme, saltHex, hashHex] = stored.split(":");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = crypto.scryptSync(password, Buffer.from(saltHex, "hex"), expected.length);
  return crypto.timingSafeEqual(actual, expected);
}

function sameText(a: string, b: string) {
  const ha = crypto.createHash("sha256").update(a).digest();
  const hb = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

export function checkCredentials(email: string, password: string) {
  if (!adminConfigured()) return false;
  const emailOk = sameText(email.trim().toLowerCase(), env("ADMIN_EMAIL").toLowerCase());
  const passwordOk = verifyPassword(password, env("ADMIN_PASSWORD_HASH"));
  return emailOk && passwordOk;
}

function sign(payload: string) {
  return crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}

export async function startSession() {
  const payload = Buffer.from(JSON.stringify({
    email: env("ADMIN_EMAIL"),
    exp: Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000
  })).toString("base64url");
  (await cookies()).set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

export async function isAdmin() {
  if (!adminConfigured()) return false;
  const value = (await cookies()).get(COOKIE)?.value;
  if (!value) return false;
  const [payload, signature] = value.split(".");
  if (!payload || !signature || !sameText(sign(payload), signature)) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    // Trocar ADMIN_EMAIL na Vercel invalida as sessões antigas.
    return data.exp > Date.now() && data.email === env("ADMIN_EMAIL");
  } catch {
    return false;
  }
}

/** Use no início de páginas e ações do painel. */
export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}
