"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/db/products";
import NewsletterForm from "./NewsletterForm";
import ProductCard from "./ProductCard";
import { useShop } from "./ShopShell";

type Sort = "featured" | "price-low" | "price-high" | "name";

export default function Home() {
  const { store, products, search } = useShop();
  const t = store.texts;

  const [category, setCategory] = useState("Todos");
  const [sort, setSort] = useState<Sort>("featured");

  const categories = useMemo(
    () => ["Todos", ...new Set(products.map(p => p.category).filter(Boolean))],
    [products]
  );
  const featured = useMemo(() => products.filter(p => p.featured).slice(0, 4), [products]);

  const filtered = useMemo(() => {
    let r = [...products];
    if (category !== "Todos") r = r.filter(p => p.category === category);
    const q = search.trim().toLowerCase();
    if (q) r = r.filter(p => `${p.name} ${p.category} ${p.reference ?? ""} ${p.colors.join(" ")}`.toLowerCase().includes(q));
    if (sort === "price-low") r.sort((a, b) => a.price - b.price);
    if (sort === "price-high") r.sort((a, b) => b.price - a.price);
    if (sort === "name") r.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    if (sort === "featured") r.sort((a, b) => Number(b.featured) - Number(a.featured));
    return r;
  }, [products, category, search, sort]);

  const card = (p: Product) => <ProductCard key={p.id} product={p} installments={store.commerce.installments} />;

  return (
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
          {t.hero.image ? (
            <img className="hero-card hero-image" src={t.hero.image} alt={store.name} />
          ) : (
            <div className="hero-card card-front">
              <span>{t.hero.cardTop}</span>
              <strong>{t.hero.cardBottom}</strong>
              <small>{t.hero.cardCaption}</small>
            </div>
          )}
        </div>
      </section>

      <section className="benefits" aria-label="Benefícios">
        {t.benefits.map(b => (
          <div key={b.title}><span>{b.icon}</span><div><strong>{b.title}</strong><small>{b.text}</small></div></div>
        ))}
      </section>

      {featured.length > 0 && (
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
      )}

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

        {products.length > 0 && (
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
        )}

        <div className="product-grid">{filtered.map(card)}</div>
        {filtered.length === 0 && (
          <div className="empty-state">
            <div>{products.length ? "🔎" : "🛍"}</div>
            <h3>{products.length ? "Nenhum produto encontrado" : "Novidades chegando em breve"}</h3>
            <p>{products.length ? "Tente outra busca ou categoria." : "Estamos preparando a coleção. Volte logo!"}</p>
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
  );
}
