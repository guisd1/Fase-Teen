import type { CSSProperties, ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { getStore, type StoreConfig } from "@/stores";
import "./globals.css";

/**
 * Código da "tag HTML" do Google Search Console (prova que o site é da loja,
 * pedido pelo Google Cloud para publicar o app do YouTube). Aceita só o código
 * ou a tag <meta> inteira colada na variável GOOGLE_SITE_VERIFICATION.
 */
function googleSiteVerification() {
  const raw = (process.env.GOOGLE_SITE_VERIFICATION ?? "").trim();
  return raw.match(/content=["']([^"']+)["']/)?.[1] ?? (raw.replace(/^["']|["']$/g, "") || undefined);
}

export function generateMetadata(): Metadata {
  const store = getStore();
  const google = googleSiteVerification();
  return {
    title: store.meta.title,
    description: store.meta.description,
    metadataBase: new URL(store.siteUrl),
    ...(store.logo.icon ? { icons: { icon: store.logo.icon, apple: store.logo.icon } } : {}),
    ...(google ? { verification: { google } } : {})
  };
}

export function generateViewport(): Viewport {
  return { themeColor: getStore().theme.primary };
}

function themeVars(theme: StoreConfig["theme"]): CSSProperties {
  return {
    "--primary": theme.primary,
    "--primary-dark": theme.primaryDark,
    "--primary-soft": theme.primarySoft,
    "--primary-light": theme.primaryLight,
    "--accent": theme.accent,
    "--logo-text": theme.logoText,
    "--logo-sub": theme.logoSubText ?? theme.accent,
    "--font-logo": theme.fonts.logo ?? theme.fonts.heading,
    "--ink": theme.ink,
    "--hero-1": theme.heroGradient[0],
    "--hero-2": theme.heroGradient[1],
    "--hero-3": theme.heroGradient[2],
    "--card-1": theme.cardGradient[0],
    "--card-2": theme.cardGradient[1],
    "--card-back-1": theme.cardBackGradient[0],
    "--card-back-2": theme.cardBackGradient[1],
    "--font-heading": theme.fonts.heading,
    "--font-body": theme.fonts.body
  } as CSSProperties;
}

export default function RootLayout({ children }: { children: ReactNode }) {
  const { theme } = getStore();
  return (
    <html lang="pt-BR" style={themeVars(theme)}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href={theme.fonts.googleFontsUrl} />
      </head>
      <body>{children}</body>
    </html>
  );
}
