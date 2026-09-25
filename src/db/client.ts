import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

export function hasDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

/** Erros em que a conexão nem chegou a abrir: a consulta com certeza não rodou. */
const NOT_CONNECTED = new Set(["ENOTFOUND", "EAI_AGAIN", "ECONNREFUSED", "UND_ERR_CONNECT_TIMEOUT"]);
const isBuild = () => process.env.NEXT_PHASE === "phase-production-build";

/*
  Uma oscilação de rede até o Neon derrubava o deploy inteiro (a página de um
  produto falhava ao ser gerada). Agora a consulta é repetida até 3 vezes:
  - no build, qualquer falha de rede (ali só existem leituras);
  - no site, só quando a conexão nem abriu, para nunca gravar um pedido duas vezes.
*/
neonConfig.fetchFunction = async (input: RequestInfo | URL, init?: RequestInit) => {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fetch(input, init);
    } catch (error) {
      const code = (error as { cause?: { code?: string } })?.cause?.code ?? "";
      if (attempt >= 3 || !(isBuild() || NOT_CONNECTED.has(code))) throw error;
      await new Promise(r => setTimeout(r, 400 * attempt));
    }
  }
};

let db: ReturnType<typeof createDb> | undefined;

function createDb(url: string) {
  return drizzle(neon(url), { schema });
}

export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL não configurado. Conecte um banco Neon ao projeto na Vercel.");
  db ??= createDb(url);
  return db;
}
