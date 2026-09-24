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

function secret() {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("ADMIN_SESSION_SECRET ausente ou curto demais (mínimo 32 caracteres).");
  return s;
}

export function adminConfigured() {
  return Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD_HASH && process.env.ADMIN_SESSION_SECRET);
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
  const emailOk = sameText(email.trim().toLowerCase(), process.env.ADMIN_EMAIL!.trim().toLowerCase());
  const passwordOk = verifyPassword(password, process.env.ADMIN_PASSWORD_HASH!);
  return emailOk && passwordOk;
}

function sign(payload: string) {
  return crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}

export async function startSession() {
  const payload = Buffer.from(JSON.stringify({
    email: process.env.ADMIN_EMAIL,
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
    return data.exp > Date.now() && data.email === process.env.ADMIN_EMAIL;
  } catch {
    return false;
  }
}

/** Use no início de páginas e ações do painel. */
export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}
