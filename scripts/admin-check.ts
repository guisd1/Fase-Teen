/*
  Confere se um hash (o valor de ADMIN_PASSWORD_HASH na Vercel) corresponde à senha.
  Uso: npm run admin:check   (o comando pede o hash e a senha)
*/
import { createInterface } from "node:readline";
import { adminHashValid, checkCredentials } from "../src/lib/auth";

const rl = createInterface({ input: process.stdin });
const lines = rl[Symbol.asyncIterator]();
const ask = async (question: string) => {
  process.stdout.write(question);
  return String((await lines.next()).value ?? "").replace(/^﻿/, "").replace(/\r$/, "");
};

const hash = await ask("Cole o valor de ADMIN_PASSWORD_HASH que está na Vercel: ");
const password = await ask("Digite a senha que você usa no login: ");
rl.close();

process.env.ADMIN_PASSWORD_HASH = hash;
process.env.ADMIN_EMAIL = "conferencia@local";
process.env.ADMIN_SESSION_SECRET = "x".repeat(40);

if (!adminHashValid()) {
  console.log("\n✗ Esse valor não é um hash válido. Ele deve começar com scrypt: e ter o código completo.");
} else if (checkCredentials("conferencia@local", password)) {
  console.log("\n✓ O hash confere com essa senha. Se o login ainda falha, confira o ADMIN_EMAIL e faça o Redeploy.");
} else {
  console.log("\n✗ O hash NÃO confere com essa senha. Gere um novo com: npm.cmd run admin:hash");
}
