/*
  Gera as variáveis de login do painel.
  Uso: npm run admin:hash   (o comando pede a senha; assim símbolos como $ ! % não se perdem)
  Cole o resultado nas Environment Variables do projeto da loja na Vercel.
*/
import crypto from "node:crypto";
import { writeFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { hashPassword } from "../src/lib/auth";

let password = process.argv[2];
if (!password) {
  const rl = createInterface({ input: process.stdin });
  const lines = rl[Symbol.asyncIterator]();
  const ask = async (question: string) => {
    process.stdout.write(question);
    // Remove caracteres invisíveis que alguns terminais do Windows acrescentam.
    return String((await lines.next()).value ?? "").replace(/^﻿/, "").replace(/\r$/, "");
  };
  password = await ask("Digite a senha do painel: ");
  const again = await ask("Digite de novo para confirmar: ");
  rl.close();
  if (password !== again) {
    console.error("\nAs senhas não conferem. Rode o comando de novo.");
    process.exit(1);
  }
}
if (password.length < 8) {
  console.error("\nA senha precisa ter pelo menos 8 caracteres.");
  process.exit(1);
}

const hash = hashPassword(password);
const secret = crypto.randomBytes(32).toString("base64url");

// Salva num arquivo: copiar do terminal costuma quebrar o código em várias linhas.
const file = "admin-login.local.txt";
writeFileSync(file, [
  "Cadastre na Vercel (Settings > Environment Variables). Copie cada valor inteiro, numa linha só.",
  "Depois de cadastrar, APAGUE este arquivo.",
  "",
  "Key:   ADMIN_PASSWORD_HASH",
  `Value: ${hash}`,
  "",
  "Key:   ADMIN_SESSION_SECRET",
  `Value: ${secret}`,
  ""
].join("\n"));

console.log(`\nPronto! Abra o arquivo ${file} (na raiz do projeto) e copie os valores de lá.`);
console.log("Ele não vai para o GitHub. Apague depois de cadastrar na Vercel.\n");
console.log(`ADMIN_PASSWORD_HASH=${hash}`);
console.log(`ADMIN_SESSION_SECRET=${secret}`);
