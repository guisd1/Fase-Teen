import { and, desc, eq, isNull, lt, or, sql } from "drizzle-orm";
import { getDb, hasDatabase } from "./client";
import { coupons, type CouponRow, type NewCouponRow } from "./schema";
import { normalizeCode, type CouponRule } from "@/lib/coupon";
import { money } from "@/lib/format";

/** Confere se o cupom pode ser usado agora. Devolve a regra ou o motivo de não valer. */
export async function checkCoupon(rawCode: unknown, subtotal: number): Promise<{ coupon: CouponRow & CouponRule } | { error: string }> {
  const code = normalizeCode(rawCode);
  if (!code || !hasDatabase()) return { error: "Cupom inválido." };
  const [c] = await getDb().select().from(coupons).where(eq(coupons.code, code));
  const now = new Date();
  if (!c || !c.active) return { error: "Cupom inválido." };
  if (c.startsAt && c.startsAt > now) return { error: "Este cupom ainda não começou a valer." };
  if (c.endsAt && c.endsAt < now) return { error: "Este cupom expirou." };
  if (c.maxUses !== null && c.uses >= c.maxUses) return { error: "Este cupom já atingiu o limite de usos." };
  if (c.minSubtotal && subtotal < c.minSubtotal) return { error: `Este cupom vale para compras a partir de ${money(c.minSubtotal)} em produtos.` };
  return { coupon: c };
}

/** Conta um uso, sem passar do limite mesmo com dois pedidos ao mesmo tempo. Falso se esgotou. */
export async function redeemCoupon(id: number) {
  const [row] = await getDb().update(coupons)
    .set({ uses: sql`${coupons.uses} + 1` })
    .where(and(eq(coupons.id, id), or(isNull(coupons.maxUses), lt(coupons.uses, coupons.maxUses))))
    .returning({ id: coupons.id });
  return Boolean(row);
}

// ---- Painel ----

export async function adminListCoupons(): Promise<CouponRow[]> {
  if (!hasDatabase()) return [];
  return getDb().select().from(coupons).orderBy(desc(coupons.id));
}

export async function adminCreateCoupon(data: NewCouponRow) {
  await getDb().insert(coupons).values(data);
}

export async function adminSetCouponActive(id: number, active: boolean) {
  await getDb().update(coupons).set({ active }).where(eq(coupons.id, id));
}

export async function adminDeleteCoupon(id: number) {
  await getDb().delete(coupons).where(eq(coupons.id, id));
}
