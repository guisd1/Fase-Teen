"use client";

import { useShop } from "./ShopShell";
import { Icon } from "./Icons";

/** Coração de favoritar (sem login; fica guardado no navegador). */
export default function FavoriteButton({ productId, className = "" }: { productId: number; className?: string }) {
  const { favorites, toggleFavorite } = useShop();
  const on = favorites.includes(productId);
  return (
    <button
      type="button"
      className={`fav-btn ${on ? "on" : ""} ${className}`.trim()}
      aria-pressed={on}
      aria-label={on ? "Tirar dos favoritos" : "Adicionar aos favoritos"}
      title={on ? "Tirar dos favoritos" : "Adicionar aos favoritos"}
      onClick={e => { e.preventDefault(); e.stopPropagation(); toggleFavorite(productId); }}
    >
      <Icon name={on ? "heartFilled" : "heart"} />
    </button>
  );
}
