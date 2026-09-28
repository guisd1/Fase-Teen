import { getStore } from "@/stores";

/** Manifesto do painel: permite "Adicionar à Tela de Início" (no iPhone, necessário para as notificações). */
export function GET() {
  const store = getStore();
  const icon = store.logo.icon ?? store.texts.hero.image;
  return Response.json({
    name: `Painel ${store.name}`,
    short_name: `Painel ${store.name}`,
    start_url: "/admin",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: store.theme.ink,
    icons: icon ? [{ src: icon, sizes: "256x256", type: icon.endsWith(".webp") ? "image/webp" : "image/png", purpose: "any" }] : []
  }, { headers: { "Content-Type": "application/manifest+json" } });
}
