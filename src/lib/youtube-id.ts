/** Extrai o id de links como youtube.com/watch?v=ID, youtu.be/ID ou youtube.com/shorts/ID. */
export function youtubeId(url: string | null | undefined) {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|[?&]v=|\/shorts\/|\/embed\/|\/live\/)([\w-]{11})/);
  return match ? match[1] : null;
}
