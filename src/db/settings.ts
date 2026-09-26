import { cache } from "react";
import { eq } from "drizzle-orm";
import { getDb, hasDatabase } from "./client";
import { settings } from "./schema";
import { DEFAULT_FEES, NO_FEES, type PaymentFees } from "@/lib/pricing";
import { mercadoPagoConfigured } from "@/lib/mercado-pago";
import { EMPTY_HOME_IMAGES, type HomeImages } from "@/lib/home-images";
import { DEFAULT_PROMOTIONS, type Promotions } from "@/lib/promotions";

export type { HomeImages };

const FEES_KEY = "payment-fees";

/** Taxas salvas no painel (ou as de referência do Mercado Pago, se nunca foram salvas). */
export const getSavedFees = cache(async (): Promise<PaymentFees> => {
  if (!hasDatabase()) return DEFAULT_FEES;
  const [row] = await getDb().select().from(settings).where(eq(settings.key, FEES_KEY));
  const v = (row?.value ?? {}) as Partial<PaymentFees>;
  return {
    pixPercent: typeof v.pixPercent === "number" ? v.pixPercent : DEFAULT_FEES.pixPercent,
    cardPercent: typeof v.cardPercent === "number" ? v.cardPercent : DEFAULT_FEES.cardPercent
  };
});

/** Taxas que valem para os preços do site: só com o Mercado Pago ativo. */
export async function getPaymentFees(): Promise<PaymentFees> {
  return mercadoPagoConfigured() ? getSavedFees() : NO_FEES;
}

export async function savePaymentFees(fees: PaymentFees) {
  await getDb().insert(settings).values({ key: FEES_KEY, value: fees })
    .onConflictDoUpdate({ target: settings.key, set: { value: fees } });
}

// ---- Imagens da página inicial (trocadas no painel, em Página inicial) ----

const HOME_KEY = "home-images";


export const getHomeImages = cache(async (): Promise<HomeImages> => {
  if (!hasDatabase()) return EMPTY_HOME_IMAGES;
  const [row] = await getDb().select().from(settings).where(eq(settings.key, HOME_KEY));
  const v = (row?.value ?? {}) as Partial<HomeImages>;
  const url = (u: unknown) => (typeof u === "string" && u.startsWith("https://") ? u : null);
  return {
    hero: Array.isArray(v.hero) ? v.hero.map(url).filter((u): u is string => !!u) : [],
    banner: url(v.banner),
    about: url(v.about)
  };
});

export async function saveHomeImages(images: HomeImages) {
  await getDb().insert(settings).values({ key: HOME_KEY, value: images })
    .onConflictDoUpdate({ target: settings.key, set: { value: images } });
}

// ---- Promoções (frete grátis, cupom da newsletter, lançamento) ----

const PROMO_KEY = "promotions";

export const getPromotions = cache(async (): Promise<Promotions> => {
  if (!hasDatabase()) return DEFAULT_PROMOTIONS;
  const [row] = await getDb().select().from(settings).where(eq(settings.key, PROMO_KEY));
  if (!row) return DEFAULT_PROMOTIONS;
  const v = row.value as Partial<Promotions>;
  const min = Number(v.freeShippingMin);
  const launch = v.launch && typeof v.launch.title === "string" && !Number.isNaN(Date.parse(v.launch.date)) ? v.launch : null;
  return {
    freeShippingMin: v.freeShippingMin === null || !Number.isFinite(min) || min <= 0 ? null : min,
    welcomeCoupon: typeof v.welcomeCoupon === "string" && v.welcomeCoupon ? v.welcomeCoupon : null,
    launch
  };
});

export async function savePromotions(promo: Promotions) {
  await getDb().insert(settings).values({ key: PROMO_KEY, value: promo })
    .onConflictDoUpdate({ target: settings.key, set: { value: promo } });
}
