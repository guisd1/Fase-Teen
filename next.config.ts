import type { NextConfig } from "next";

/*
  Cabeçalhos de segurança em todas as páginas:
  - frame-ancestors / X-Frame-Options: nenhum outro site pode mostrar a loja ou o
    painel dentro de uma moldura (golpe de "clickjacking").
  - nosniff: o navegador não "adivinha" o tipo de arquivo.
  - Referrer-Policy: outros sites só veem o domínio de onde a pessoa veio.
  - Permissions-Policy: a loja não usa câmera, microfone nem localização.
*/
const securityHeaders = [
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" }
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  }
};

export default nextConfig;
