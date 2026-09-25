"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { del } from "@vercel/blob";
import { checkCredentials, endSession, requireAdmin, startSession } from "@/lib/auth";
import { disconnectYoutube } from "@/lib/youtube";
import { adminCreateProduct, adminDeleteProduct, adminGetProduct, adminUpdateProduct } from "@/db/products";
import { adminDeleteOrder, adminSetOrderStatus, adminUpdateOrder } from "@/db/orders";
import { adminDeleteReview, adminSetReviewApproved, reviewImagesOf } from "@/db/reviews";
import { adminCreateCoupon, adminDeleteCoupon, adminSetCouponActive } from "@/db/coupons";
import { normalizeCode } from "@/lib/coupon";
import { savePaymentFees } from "@/db/settings";
import { parseFee } from "@/lib/pricing";
import type { NewProductRow, ProductImage, ProductSize } from "@/db/schema";
import { isOrderStatus, type OrderStatus } from "@/lib/order-status";

// ---- Login ----

export interface LoginState {
  error: string;
  /** Devolvido para o formulário não apagar o e-mail digitado. */
  email: string;
}

export async function login(_: LoginState | null, form: FormData): Promise<LoginState> {
  const email = String(form.get("email") || "");
  const password = String(form.get("password") || "");
  if (!checkCredentials(email, password)) {
    // Atraso fixo para dificultar tentativas em massa.
    await new Promise(r => setTimeout(r, 800));
    return { error: "E-mail ou senha incorretos.", email };
  }
  await startSession();
  redirect("/admin/produtos");
}

export async function logout() {
  await endSession();
  redirect("/admin/login");
}

// ---- Produtos ----

export interface ProductInput {
  name: string;
  reference: string;
  category: string;
  description: string;
  composition: string;
  price: string;
  oldPrice: string;
  badge: string;
  featured: boolean;
  active: boolean;
  sizes: ProductSize[];
  colors: string[];
  images: ProductImage[];
  youtubeUrl: string;
  weightKg: string;
  lengthCm: string;
  widthCm: string;
  heightCm: string;
}

/** Aceita "89,90", "89.90" e "1.299,90". Vazio vira null. */
function toNumber(value: string, label: string): number | null {
  const v = value.trim();
  if (!v) return null;
  const normalized = v.includes(",") ? v.replace(/\./g, "").replace(",", ".") : v;
  const n = Number(normalized);
  if (!Number.isFinite(n) || n < 0) throw new Error(`${label} inválido: "${value}".`);
  return n;
}

const text = (v: string) => v.trim() || null;

/** Barra valores que nenhuma transportadora aceita (ex.: peso digitado em gramas). */
function checkPackage(weightKg: number | null, dims: (number | null)[]) {
  if (weightKg !== null && weightKg > 30) {
    throw new Error(`Peso de ${weightKg} kg é alto demais. O campo é em quilos: 450 g = 0,45.`);
  }
  if (dims.some(d => d !== null && d > 105)) {
    throw new Error("Alguma medida passou de 105 cm. As medidas são da embalagem, em centímetros.");
  }
}

function toRow(input: ProductInput): NewProductRow {
  const name = input.name.trim();
  if (!name) throw new Error("O nome do produto é obrigatório.");
  const weightKg = toNumber(input.weightKg, "Peso");
  const lengthCm = toNumber(input.lengthCm, "Comprimento");
  const widthCm = toNumber(input.widthCm, "Largura");
  const heightCm = toNumber(input.heightCm, "Altura");
  checkPackage(weightKg, [lengthCm, widthCm, heightCm]);
  const seen = new Set<string>();
  const sizes = input.sizes
    .map(s => ({ size: s.size.trim(), stock: Math.max(0, Math.floor(Number(s.stock) || 0)) }))
    .filter(s => s.size && !seen.has(s.size.toLowerCase()) && seen.add(s.size.toLowerCase()));
  const colors = input.colors.map(c => c.trim()).filter(Boolean);
  return {
    name,
    reference: text(input.reference),
    category: text(input.category),
    description: input.description.trim(),
    composition: text(input.composition),
    price: toNumber(input.price, "Preço"),
    oldPrice: toNumber(input.oldPrice, "Preço antigo"),
    badge: text(input.badge)?.toUpperCase() ?? null,
    featured: input.featured,
    active: input.active,
    sizes,
    colors,
    // Foto marcada com uma cor que não existe mais volta a valer para todas.
    images: input.images.filter(i => i.src).map(i => ({ src: i.src, color: i.color && colors.includes(i.color) ? i.color : null })),
    youtubeUrl: text(input.youtubeUrl),
    weightKg, lengthCm, widthCm, heightCm
  };
}

/** Apaga do Vercel Blob as fotos que não são mais usadas (economiza o limite de 1 GB). */
async function deleteBlobs(urls: string[]) {
  const blobUrls = urls.filter(u => u.includes(".blob.vercel-storage.com/"));
  if (!blobUrls.length) return;
  try {
    await del(blobUrls);
  } catch (error) {
    console.error("Não foi possível apagar fotos do Blob:", error);
  }
}

function refreshSite() {
  revalidatePath("/", "layout");
}

export async function saveProduct(id: number | null, input: ProductInput): Promise<{ error?: string; id?: number }> {
  await requireAdmin();
  try {
    const row = toRow(input);
    if (id) {
      const before = await adminGetProduct(id);
      if (!before) return { error: "Produto não encontrado." };
      await adminUpdateProduct(id, row);
      const kept = new Set(row.images!.map(i => i.src));
      await deleteBlobs(before.images.map(i => i.src).filter(src => !kept.has(src)));
    } else {
      id = await adminCreateProduct(row);
    }
    refreshSite();
    return { id };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Não foi possível salvar." };
  }
}

export async function deleteProduct(id: number) {
  await requireAdmin();
  // As avaliações somem junto com o produto (cascade); as fotos delas precisam sair do Blob também.
  const reviewPhotos = await reviewImagesOf(id);
  const removed = await adminDeleteProduct(id);
  if (removed) await deleteBlobs([...removed.images.map(i => i.src), ...reviewPhotos]);
  refreshSite();
  redirect("/admin/produtos");
}

export async function setProductActive(id: number, active: boolean) {
  await requireAdmin();
  await adminUpdateProduct(id, { active });
  refreshSite();
  revalidatePath("/admin/produtos");
}

// ---- Integrações ----

export async function disconnectYoutubeAction() {
  await requireAdmin();
  await disconnectYoutube();
  revalidatePath("/admin/integracoes");
}

// ---- Pedidos ----

export async function setOrderStatus(id: number, status: OrderStatus): Promise<{ error?: string }> {
  await requireAdmin();
  if (!isOrderStatus(status)) return { error: "Status inválido." };
  try {
    await adminSetOrderStatus(id, status);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Não foi possível mudar o status." };
  }
  // O estoque pode ter mudado.
  refreshSite();
  return {};
}

export async function saveOrderNotes(id: number, form: FormData) {
  await requireAdmin();
  await adminUpdateOrder(id, {
    trackingCode: String(form.get("trackingCode") || "").trim() || null,
    adminNotes: String(form.get("adminNotes") || "").trim() || null
  });
  revalidatePath(`/admin/pedidos/${id}`);
}

export async function deleteOrder(id: number) {
  await requireAdmin();
  await adminDeleteOrder(id);
  refreshSite();
  redirect("/admin/pedidos");
}

// ---- Avaliações ----

export async function setReviewApproved(id: number, approved: boolean) {
  await requireAdmin();
  await adminSetReviewApproved(id, approved);
  refreshSite();
}

export async function deleteReview(id: number) {
  await requireAdmin();
  const removed = await adminDeleteReview(id);
  if (removed) await deleteBlobs(removed.images);
  refreshSite();
}

// ---- Cupons ----

/** Data do formulário (AAAA-MM-DD) no horário de Brasília: início do dia ou fim do dia. */
const brDate = (v: FormDataEntryValue | null, end: boolean) =>
  /^\d{4}-\d{2}-\d{2}$/.test(String(v)) ? new Date(`${v}T${end ? "23:59:59" : "00:00:00"}-03:00`) : null;

export async function createCoupon(form: FormData) {
  await requireAdmin();
  const fail = (msg: string) => redirect(`/admin/cupons?erro=${encodeURIComponent(msg)}`);
  const code = normalizeCode(form.get("code"));
  const type = form.get("type") === "fixed" ? "fixed" : "percent";
  let value: number | null, minSubtotal: number | null;
  try {
    value = toNumber(String(form.get("value") || ""), "Valor");
    minSubtotal = toNumber(String(form.get("minSubtotal") || ""), "Compra mínima");
  } catch (error) {
    return fail((error as Error).message);
  }
  const maxUsesText = String(form.get("maxUses") || "").trim();
  const maxUses = maxUsesText ? Math.floor(Number(maxUsesText)) : null;
  const startsAt = brDate(form.get("startsAt"), false);
  const endsAt = brDate(form.get("endsAt"), true);

  if (!/^[A-Z0-9_-]{3,40}$/.test(code)) return fail("Use de 3 a 40 letras, números, - ou _ no código.");
  if (!value || value <= 0) return fail("Informe o valor do desconto.");
  if (type === "percent" && value > 90) return fail("Desconto em porcentagem vai até 90%.");
  if (maxUses !== null && !(maxUses >= 1)) return fail("Limite de usos inválido.");
  if (startsAt && endsAt && endsAt < startsAt) return fail("A data final é antes da inicial.");

  try {
    await adminCreateCoupon({ code, type, value, minSubtotal, maxUses, startsAt, endsAt });
  } catch {
    return fail(`Já existe um cupom ${code}.`);
  }
  revalidatePath("/admin/cupons");
  redirect("/admin/cupons");
}

export async function setCouponActive(id: number, active: boolean) {
  await requireAdmin();
  await adminSetCouponActive(id, active);
  revalidatePath("/admin/cupons");
}

export async function deleteCoupon(id: number) {
  await requireAdmin();
  await adminDeleteCoupon(id);
  revalidatePath("/admin/cupons");
}

// ---- Taxas do Mercado Pago ----

export async function savePaymentFeesAction(form: FormData) {
  await requireAdmin();
  let pixPercent: number, cardPercent: number;
  try {
    pixPercent = parseFee(String(form.get("pixPercent") ?? ""), "Taxa do Pix");
    cardPercent = parseFee(String(form.get("cardPercent") ?? ""), "Taxa do cartão");
  } catch (error) {
    redirect(`/admin/integracoes?taxas=${encodeURIComponent((error as Error).message)}`);
  }
  await savePaymentFees({ pixPercent, cardPercent });
  // Todos os preços do site mudam.
  refreshSite();
  redirect("/admin/integracoes?taxas=ok#mercado-pago");
}
