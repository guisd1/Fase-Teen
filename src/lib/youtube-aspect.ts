/*
  Formato (largura ÷ altura) dos vídeos do YouTube, para o player do site
  preencher o quadro sem bordas pretas. O link público não diz se o vídeo é
  vertical, então:
  - youtube.com/shorts/ID responde 200 para Shorts (verticais) e redireciona os outros;
  - para os demais, o oEmbed traz largura e altura.
  O resultado fica guardado no Redis (um vídeo não muda de formato).
*/
import { getRedis, hasRedis } from "./redis";

const DEFAULT = 16 / 9;
const key = (id: string) => `yt-aspect:${id}`;

async function detect(id: string): Promise<number | null> {
  const signal = AbortSignal.timeout(4000);
  try {
    const shorts = await fetch(`https://www.youtube.com/shorts/${id}`, { method: "HEAD", redirect: "manual", signal, cache: "no-store" });
    if (shorts.status === 200) return 9 / 16;
    const r = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}`, { signal, cache: "no-store" });
    if (!r.ok) return null;
    const { width, height } = await r.json();
    return Number(width) > 0 && Number(height) > 0 ? Number(width) / Number(height) : null;
  } catch {
    return null;
  }
}

/** Formato de cada vídeo (16:9 se não der para descobrir). Nunca lança erro. */
export async function youtubeAspects(ids: string[]): Promise<Map<string, number>> {
  const unique = [...new Set(ids)];
  const result = new Map<string, number>();
  if (!unique.length) return result;
  let cached: (number | null)[] = [];
  if (hasRedis()) {
    try { cached = await getRedis().mget<(number | null)[]>(...unique.map(key)); } catch { cached = []; }
  }
  await Promise.all(unique.map(async (id, i) => {
    const hit = Number(cached[i]);
    if (hit > 0) { result.set(id, hit); return; }
    const found = await detect(id);
    result.set(id, found ?? DEFAULT);
    if (found && hasRedis()) await getRedis().set(key(id), found, { ex: 60 * 60 * 24 * 90 }).catch(() => {});
  }));
  return result;
}
