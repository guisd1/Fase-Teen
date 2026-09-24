/*
  Gera as variáveis de login do painel.
  Uso: npm run admin:hash -- "sua senha"
  Cole o resultado nas Environment Variables do projeto da loja na Vercel.
*/
import crypto from "node:crypto";
import { hashPassword } from "../src/lib/auth";

const password = process.argv[2];
if (!password || password.length < 8) {
  console.error('Informe uma senha com pelo menos 8 caracteres: npm run admin:hash -- "sua senha"');
  process.exit(1);
}

console.log(`ADMIN_PASSWORD_HASH=${hashPassword(password)}`);
console.log(`ADMIN_SESSION_SECRET=${crypto.randomBytes(32).toString("base64url")}`);
