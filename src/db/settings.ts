import { cache } from "react";
import { eq } from "drizzle-orm";
import { getDb, hasDatabase } from "./client";
import { settings } from "./schema";
import { DEFAULT_FEES, NO_FEES, type PaymentFees } from "@/lib/pricing";
import { mercadoPagoConfigured } from "@/lib/mercado-pago";

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
