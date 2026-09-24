"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Product } from "@/db/products";
import type { StoreConfig } from "@/stores/types";
import { whatsappUrl } from "@/lib/whatsapp";
import { Footer, Logo } from "./Chrome";
import CartDrawer from "./CartDrawer";
import CheckoutModal from "./CheckoutModal";
import NewsletterForm from "./NewsletterForm";
import ProductCard from "./ProductCard";
import ProductModal from "./ProductModal";
import { useCart } from "./useCart";

type Sort = "featured" | "price-low" | "price-high" | "name";

export default function Storefront({ store, products }: { store: StoreConfig; products: Product[] }) {
  const t = store.texts;
  const cart = useCart(store.id, products);

  const [category, setCategory] = useState("Todos");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<Sort>("featured");
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [modalProduct, setModalProduct] = useState<Product | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const cepInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.body.style.overflow = modalProduct || checkoutOpen ? "hidden" : "";
  }, [modalProduct, checkoutOpen]);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  const categories = useMemo(() => ["Todos", ...new Set(products.map(p => p.category))], [products]);
  const featured = useMemo(() => products.filter(p => p.featured).slice(0, 4), [products]);

  const filtered = useMemo(() => {
    let r = [...products];
    if (category !== "Todos") r = r.filter(p => p.category === category);
    const q = search.trim().toLowerCase();
    if (q) r = r.filter(p => `${p.name} ${p.category} ${p.colors.join(" ")}`.toLowerCase().includes(q));
    if (sort === "price-low") r.sort((a, b) => a.price - b.price);
    if (sort === "price-high") r.sort((a, b) => b.price - a.price);
    if (sort === "name") r.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    if (sort === "featured") r.sort((a, b) => Number(b.featured) - Number(a.featured));
    return r;
  }, [products, category, search, sort]);

  const openCheckout = () => {
    if (!cart.items.length) return;
    if (cart.deliveryMode === "delivery" && !cart.selectedShipping) {
      cart.setShippingStatus("Calcule e escolha o frete antes de finalizar.");
      cepInputRef.current?.focus();
      return;
    }
    setCheckoutOpen(true);
  };

  const card = (p: Product) => (
    <ProductCard key={p.id} product={p} installments={store.commerce.installments} onOpen={setModalProduct} />
  );
  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <div className="topbar">{t.topbar}</div>

      <header className="header">
        <div className="header-inner">
          <button className="icon-btn mobile-menu-btn" type="button" aria-label="Abrir menu" onClick={() => setMenuOpen(o => !o)}>☰</button>
          <Logo store={store} href="#inicio" />
          <nav className={`nav ${menuOpen ? "open" : ""}`}>
            <a href="#inicio" onClick={closeMenu}>{t.nav.home}</a>
            <a href="#novidades" onClick={closeMenu}>{t.nav.news}</a>
            <a href="#colecao" onClick={closeMenu}>{t.nav.collection}</a>
            <a href="#sobre" onClick={closeMenu}>{t.nav.about}</a>
          </nav>
          <div className="header-actions">
            <button className="icon-btn" type="button" aria-label="Pesquisar" onClick={() => setSearchOpen(o => !o)}>⌕</button>
            <button className="icon-btn bag-btn" type="button" aria-label="Abrir carrinho" onClick={() => setCartOpen(true)}>
              🛍<span className="cart-count">{cart.count}</span>
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
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </header>

      <main id="inicio">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">{t.hero.eyebrow}</p>
            <h1>{t.hero.title}</h1>
            <p className="hero-text">{t.hero.text}</p>
            <div className="hero-buttons">
              <a className="btn btn-dark" href="#colecao">{t.hero.primaryCta}</a>
              <a className="btn btn-light" href="#novidades">{t.hero.secondaryCta}</a>
            </div>
          </div>
          <div className="hero-art">
            <div className="hero-pill">{t.hero.pill}</div>
            <div className="hero-card card-back" />
            <div className="hero-card card-front">
              <span>{t.hero.cardTop}</span>
              <strong>{t.hero.cardBottom}</strong>
              <small>{t.hero.cardCaption}</small>
            </div>
          </div>
        </section>

        <section className="benefits" aria-label="Benefícios">
          {t.benefits.map(b => (
            <div key={b.title}><span>{b.icon}</span><div><strong>{b.title}</strong><small>{b.text}</small></div></div>
          ))}
        </section>

        <section className="section" id="novidades">
          <div className="section-head">
            <div>
              <p className="eyebrow">{t.featured.eyebrow}</p>
              <h2>{t.featured.title}</h2>
            </div>
            <a className="text-link" href="#colecao">{t.featured.link}</a>
          </div>
          <div className="product-grid">{featured.map(card)}</div>
        </section>

        <section className="banner">
          <div>
            <p className="eyebrow">{t.banner.eyebrow}</p>
            <h2>{t.banner.title}</h2>
            <p>{t.banner.text}</p>
            <a className="btn btn-dark" href="#colecao">{t.banner.cta}</a>
          </div>
          <div className="banner-stickers">
            {t.banner.stickers.map(s => <span key={s}>{s}</span>)}
          </div>
        </section>

        <section className="section collection-section" id="colecao">
          <div className="section-head">
            <div>
              <p className="eyebrow">{t.catalog.eyebrow}</p>
              <h2>{t.catalog.title}</h2>
            </div>
          </div>

          <div className="filters">
            <div className="chips">
              {categories.map(c => (
                <button key={c} type="button" className={`chip ${category === c ? "active" : ""}`} onClick={() => setCategory(c)}>{c}</button>
              ))}
            </div>
            <div className="sort-wrap">
              <label htmlFor="sortSelect">Ordenar</label>
              <select id="sortSelect" value={sort} onChange={e => setSort(e.target.value as Sort)}>
                <option value="featured">Destaques</option>
                <option value="price-low">Menor preço</option>
                <option value="price-high">Maior preço</option>
                <option value="name">Nome</option>
              </select>
            </div>
          </div>

          <div className="product-grid">{filtered.map(card)}</div>
          {filtered.length === 0 && (
            <div className="empty-state">
              <div>🔎</div>
              <h3>Nenhum produto encontrado</h3>
              <p>Tente outra busca ou categoria.</p>
            </div>
          )}
        </section>

        <section className="about" id="sobre">
          <div className="about-mark">{store.logo.monogram}</div>
          <div>
            <p className="eyebrow">{t.about.eyebrow}</p>
            <h2>{t.about.title}</h2>
            {t.about.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
            <a className="btn btn-outline" href="#colecao">{t.about.cta}</a>
          </div>
        </section>

        <section className="newsletter">
          <div>
            <p className="eyebrow">{t.newsletter.eyebrow}</p>
            <h2>{t.newsletter.title}</h2>
          </div>
          <NewsletterForm />
        </section>
      </main>

      <Footer store={store} />

      <a className="floating-whatsapp" href={whatsappUrl(store, t.whatsappGreeting)} target="_blank" rel="noopener" aria-label="Falar no WhatsApp">☏</a>

      <CartDrawer
        cart={cart}
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onCheckout={openCheckout}
        cepInputRef={cepInputRef}
      />

      {modalProduct && (
        <ProductModal
          key={modalProduct.id}
          product={modalProduct}
          onClose={() => setModalProduct(null)}
          onAdd={item => { cart.addToCart(item); setModalProduct(null); setCartOpen(true); }}
        />
      )}

      {checkoutOpen && (
        <CheckoutModal
          store={store}
          cart={cart}
          onClose={() => setCheckoutOpen(false)}
          onBackToCart={() => { setCheckoutOpen(false); setCartOpen(true); }}
        />
      )}
    </>
  );
}
