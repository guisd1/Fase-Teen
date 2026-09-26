"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { Product } from "@/db/products";
import type { StoreConfig } from "@/stores/types";
import { whatsappUrl } from "@/lib/whatsapp";
import { Footer, Logo } from "./Chrome";
import CartDrawer from "./CartDrawer";
import CheckoutModal from "./CheckoutModal";
import { useCart, type Cart } from "./useCart";
import { Icon, WhatsappIcon } from "./Icons";
import { startVisit } from "@/lib/traffic-source";
import { trackVisit } from "@/lib/track";

interface Shop {
  store: StoreConfig;
  products: Product[];
  cart: Cart;
  search: string;
  openCart: () => void;
}

const ShopContext = createContext<Shop | null>(null);

export function useShop() {
  const shop = useContext(ShopContext);
  if (!shop) throw new Error("useShop precisa estar dentro de <ShopShell>.");
  return shop;
}

/** Cabeçalho, rodapé, carrinho e checkout, compartilhados por todas as páginas da loja. */
export default function ShopShell({ store, products, onlinePayments, children }: {
  store: StoreConfig;
  products: Product[];
  /** Mercado Pago configurado: o checkout oferece Pix e cartão. */
  onlinePayments: boolean;
  children: ReactNode;
}) {
  const t = store.texts;
  const cart = useCart(store.id, products);
  const router = useRouter();
  const pathname = usePathname();

  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const cepInputRef = useRef<HTMLInputElement>(null);

  // Uma vez por visita: registra de onde a pessoa veio (anúncio, Instagram, Google...).
  useEffect(() => {
    const visit = startVisit();
    if (visit) trackVisit(visit.source, visit.campaign);
  }, []);

  useEffect(() => {
    document.body.style.overflow = checkoutOpen ? "hidden" : "";
  }, [checkoutOpen]);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  const onSearch = (value: string) => {
    setSearch(value);
    if (pathname !== "/") router.push("/#colecao");
  };

  const openCheckout = () => {
    if (!cart.items.length) return;
    if (cart.deliveryMode === "delivery" && !cart.selectedShipping) {
      cart.setShippingStatus("Calcule e escolha o frete antes de finalizar.");
      cepInputRef.current?.focus();
      return;
    }
    setCheckoutOpen(true);
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <ShopContext.Provider value={{ store, products, cart, search, openCart: () => setCartOpen(true) }}>
      <div className="topbar">{t.topbar}</div>

      <header className="header">
        <div className="header-inner">
          <button className="icon-btn mobile-menu-btn" type="button" aria-label="Abrir menu" onClick={() => setMenuOpen(o => !o)}><Icon name="menu" /></button>
          <Logo store={store} href="/" />
          <nav className={`nav ${menuOpen ? "open" : ""}`}>
            <Link href="/#inicio" onClick={closeMenu}>{t.nav.home}</Link>
            <Link href="/#novidades" onClick={closeMenu}>{t.nav.news}</Link>
            <Link href="/#colecao" onClick={closeMenu}>{t.nav.collection}</Link>
            <Link href="/#sobre" onClick={closeMenu}>{t.nav.about}</Link>
            <Link href="/acompanhar" onClick={closeMenu}>Meu pedido</Link>
          </nav>
          <div className="header-actions">
            <button className="icon-btn" type="button" aria-label="Pesquisar" onClick={() => setSearchOpen(o => !o)}><Icon name="search" /></button>
            <button className="icon-btn bag-btn" type="button" aria-label="Abrir carrinho" onClick={() => setCartOpen(true)}>
              <Icon name="bag" /><span className="cart-count">{cart.count}</span>
            </button>
          </div>
        </div>
        <div className={`search-bar-wrap ${searchOpen ? "show" : ""}`}>
          <input
            ref={searchRef}
            type="search"
            placeholder={t.catalog.searchPlaceholder}
            autoComplete="off"
            value={search}
            onChange={e => onSearch(e.target.value)}
          />
        </div>
      </header>

      {children}

      <Footer store={store} />

      <a className="floating-whatsapp" href={whatsappUrl(store, t.whatsappGreeting)} target="_blank" rel="noopener" aria-label="Falar no WhatsApp"><WhatsappIcon /></a>

      <CartDrawer
        cart={cart}
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onCheckout={openCheckout}
        cepInputRef={cepInputRef}
      />

      {checkoutOpen && (
        <CheckoutModal
          store={store}
          cart={cart}
          onlinePayments={onlinePayments}
          onClose={() => setCheckoutOpen(false)}
          onBackToCart={() => { setCheckoutOpen(false); setCartOpen(true); }}
        />
      )}
    </ShopContext.Provider>
  );
}
