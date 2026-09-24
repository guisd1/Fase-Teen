import type { StoreConfig } from "@/stores/types";

export function whatsappUrl(store: StoreConfig, text?: string) {
  const base = `https://wa.me/${store.contact.whatsapp}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

/** Falso enquanto o número ainda for o placeholder do template. */
export function hasWhatsapp(store: StoreConfig) {
  return Boolean(store.contact.whatsapp) && !store.contact.whatsapp.includes("0000");
}
