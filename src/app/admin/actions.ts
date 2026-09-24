"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { del } from "@vercel/blob";
import { checkCredentials, endSession, requireAdmin, startSession } from "@/lib/auth";
import { disconnectYoutube } from "@/lib/youtube";
import { adminCreateProduct, adminDeleteProduct, adminGetProduct, adminUpdateProduct } from "@/db/products";
import type { NewProductRow, ProductImage, ProductSize } from "@/db/schema";

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
  const removed = await adminDeleteProduct(id);
  if (removed) await deleteBlobs(removed.images.map(i => i.src));
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
