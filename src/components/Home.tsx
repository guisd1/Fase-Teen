"use client";

import { useEffect, useMemo, useState } from "react";
import type { Product } from "@/db/products";
import { EMPTY_HOME_IMAGES, type HomeImages } from "@/lib/home-images";
import NewsletterForm from "./NewsletterForm";
import ProductCard from "./ProductCard";
import { useShop } from "./ShopShell";
import { Icon } from "./Icons";
import { optimized } from "@/lib/image";

type Sort = "featured" | "price-low" | "price-high" | "name";

/** Fotos do destaque do topo: com mais de uma, troca a cada 5 segundos. */
function HeroSlides({ images, alt }: { images: string[]; alt: string }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (images.length < 2) return;
    const timer = setInterval(() => setIndex(i => (i + 1) % images.length), 5000);
    return () => clearInterval(timer);
  }, [images.length]);
  return (
    <div className="hero-card hero-slides">
      {images.map((src, i) => <img key={src} {...optimized(src, "(max-width: 760px) 70vw, 380px")} alt={i === index ? alt : ""} className={i === index ? "active" : ""} />)}
      {images.length > 1 && (
        <div className="hero-slides-dots">
          {images.map((_, i) => <button key={i} type="button" className={i === index ? "active" : ""} onClick={() => setIndex(i)} aria-label={`Foto ${i + 1}`} />)}
        </div>
      )}
    </div>
  );
}

const PRICE_RANGES = [
  { key: "", label: "Qualquer preço", min: 0, max: Infinity },
  { key: "ate150", label: "Até R$ 150", min: 0, max: 150 },
  { key: "150a250", label: "R$ 150 a R$ 250", min: 150, max: 250 },
  { key: "250a350", label: "R$ 250 a R$ 350", min: 250, max: 350 },
  { key: "350", label: "Acima de R$ 350", min: 350, max: Infinity }
];

const CLOCK_LABELS = { d: "dias", h: "horas", m: "min", s: "seg" } as const;

/** Contagem regressiva do próximo lançamento (painel → Promoções). */
function LaunchCountdown({ title, date }: { title: string; date: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const left = now === null ? null : new Date(date).getTime() - now;
  if (left !== null && left <= 0) return null;
  const p = left === null ? null : {
    d: Math.floor(left / 864e5), h: Math.floor(left / 36e5) % 24, m: Math.floor(left / 6e4) % 60, s: Math.floor(left / 1e3) % 60
  };
  return (
    <section className="launch" aria-label={`Contagem para o lançamento ${title}`}>
      <div>
        <p className="eyebrow">PRÓXIMO LANÇAMENTO</p>
        <h2>{title}</h2>
      </div>
      <div className="launch-clock">
        {(["d", "h", "m", "s"] as const).map(k => (
          <div key={k}><strong>{p ? String(p[k]).padStart(2, "0") : "--"}</strong><small>{CLOCK_LABELS[k]}</small></div>
        ))}
      </div>
      <a className="btn btn-dark" href="#newsletter">Entrar na lista VIP</a>
    </section>
  );
}

export interface CustomerPhoto { src: string; name: string; rating: number; productName: string; href: string }

export default function Home({ images = EMPTY_HOME_IMAGES, photos = [], welcome = null }: {
  images?: HomeImages;
  /** Fotos das avaliações aprovadas (clientes usando as peças). */
  photos?: CustomerPhoto[];
  /** Cupom de boas-vindas da newsletter, se estiver ativo. */
  welcome?: { code: string; label: string } | null;
}) {
  const { store, products, search, promotions, favorites } = useShop();
  const t = store.texts;

  const [category, setCategory] = useState("Todos");
  const [sort, setSort] = useState<Sort>("featured");
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [price, setPrice] = useState("");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const sizes = useMemo(
    () => [...new Set(products.flatMap(p => p.sizes.map(s => s.size)))].sort((a, b) => (Number(a) || 999) - (Number(b) || 999) || a.localeCompare(b)),
    [products]
  );
  const colors = useMemo(() => [...new Set(products.flatMap(p => p.colors))].sort((a, b) => a.localeCompare(b, "pt-BR")), [products]);
  const range = PRICE_RANGES.find(r => r.key === price) ?? PRICE_RANGES[0];
  const anyFilter = Boolean(size || color || price || onlyFavorites || category !== "Todos");
  const clearFilters = () => { setSize(""); setColor(""); setPrice(""); setOnlyFavorites(false); setCategory("Todos"); };

  const categories = useMemo(
    () => ["Todos", ...new Set(products.map(p => p.category).filter(Boolean))],
    [products]
  );
  const featured = useMemo(() => products.filter(p => p.featured).slice(0, 4), [products]);

  const filtered = useMemo(() => {
    let r = [...products];
    if (category !== "Todos") r = r.filter(p => p.category === category);
    if (size) r = r.filter(p => p.sizes.some(s => s.size === size && s.stock > 0));
    if (color) r = r.filter(p => p.colors.includes(color));
    if (price) r = r.filter(p => p.price >= range.min && p.price < range.max);
    if (onlyFavorites) r = r.filter(p => favorites.includes(p.id));
    const q = search.trim().toLowerCase();
    if (q) r = r.filter(p => `${p.name} ${p.category} ${p.reference ?? ""} ${p.colors.join(" ")}`.toLowerCase().includes(q));
    if (sort === "price-low") r.sort((a, b) => a.price - b.price);
    if (sort === "price-high") r.sort((a, b) => b.price - a.price);
    if (sort === "name") r.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    if (sort === "featured") r.sort((a, b) => Number(b.featured) - Number(a.featured));
    return r;
  }, [products, category, search, sort, size, color, price, onlyFavorites, favorites, range]);

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
          {images.hero.length > 0 ? (
            <HeroSlides images={images.hero} alt={store.name} />
          ) : t.hero.image ? (
            <img className="hero-card hero-image" src={t.hero.image} alt={store.name} />
          ) : (
            <div className={`hero-card card-front ${store.logo.subAlign === "right" ? "logo-sub-right" : ""}`}>
              <span>{t.hero.cardTop}</span>
              <strong>{t.hero.cardBottom}</strong>
              <small>{t.hero.cardCaption}</small>
            </div>
          )}
        </div>
      </section>

      {promotions.launch && <LaunchCountdown title={promotions.launch.title} date={promotions.launch.date} />}

      <section className="benefits" aria-label="Benefícios">
        {t.benefits.map(b => (
          <div key={b.title}><span><Icon name={b.icon} /></span><div><strong>{b.title}</strong><small>{b.text}</small></div></div>
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
        {images.banner ? (
          <img className="banner-photo" {...optimized(images.banner, "(max-width: 760px) 100vw, 380px")} alt="" loading="lazy" />
        ) : (
          <div className="banner-stickers">
            {t.banner.stickers.map(s => <span key={s}>{s}</span>)}
          </div>
        )}
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
              <button type="button" className={`chip chip-fav ${onlyFavorites ? "active" : ""}`} onClick={() => setOnlyFavorites(v => !v)} aria-pressed={onlyFavorites}>
                <Icon name={onlyFavorites ? "heartFilled" : "heart"} /> Favoritos{favorites.length ? ` (${favorites.length})` : ""}
              </button>
            </div>
            <div className="filter-selects">
              {sizes.length > 0 && (
                <select aria-label="Tamanho" value={size} onChange={e => setSize(e.target.value)}>
                  <option value="">Todos os tamanhos</option>
                  {sizes.map(s => <option key={s} value={s}>Tamanho {s}</option>)}
                </select>
              )}
              {colors.length > 0 && (
                <select aria-label="Cor" value={color} onChange={e => setColor(e.target.value)}>
                  <option value="">Todas as cores</option>
                  {colors.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              )}
              <select aria-label="Preço" value={price} onChange={e => setPrice(e.target.value)}>
                {PRICE_RANGES.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
              </select>
              {anyFilter && <button type="button" className="text-link clear-filters" onClick={clearFilters}>Limpar filtros</button>}
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
            <div><Icon name={products.length ? "search" : "bag"} /></div>
            <h3>{products.length ? "Nenhum produto encontrado" : "Novidades chegando em breve"}</h3>
            <p>{onlyFavorites && !favorites.length ? "Toque no coração das peças que você gostar para guardar aqui." : products.length ? "Tente outra busca ou outros filtros." : "Estamos preparando a coleção. Volte logo!"}</p>
          </div>
        )}
      </section>

      {photos.length > 0 && (
        <section className="section customer-photos">
          <div className="section-head">
            <div>
              <p className="eyebrow">QUEM USA</p>
              <h2>Clientes {store.name}</h2>
            </div>
          </div>
          <div className="customer-grid">
            {photos.map((ph, i) => (
              <a key={i} href={ph.href} className="customer-photo">
                <img {...optimized(ph.src, "(max-width: 760px) 50vw, 25vw")} alt={`${ph.name} usando ${ph.productName}`} loading="lazy" />
                <span><strong>{ph.name}</strong> {"★".repeat(ph.rating)}<small>{ph.productName}</small></span>
              </a>
            ))}
          </div>
        </section>
      )}

      <section className="about" id="sobre">
        {images.about
          ? <img className="about-photo" {...optimized(images.about, "(max-width: 760px) 90vw, 340px")} alt={store.name} loading="lazy" />
          : <div className="about-mark">{store.logo.icon ? <img src={store.logo.icon} alt="" /> : store.logo.monogram}</div>}
        <div>
          <p className="eyebrow">{t.about.eyebrow}</p>
          <h2>{t.about.title}</h2>
          {t.about.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
          <a className="btn btn-outline" href="#colecao">{t.about.cta}</a>
        </div>
      </section>

      <section className="newsletter" id="newsletter">
        <div>
          <p className="eyebrow">{t.newsletter.eyebrow}</p>
          <h2>{welcome ? `Ganhe ${welcome.label} na primeira compra.` : t.newsletter.title}</h2>
          {welcome && <p className="newsletter-sub">Assine e receba o cupom na hora, além dos lançamentos antes de todo mundo.</p>}
        </div>
        <NewsletterForm welcome={welcome} />
      </section>
    </main>
  );
}
