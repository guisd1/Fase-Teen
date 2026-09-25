import type { StoreConfig } from "@/stores/types";
import { whatsappUrl } from "@/lib/whatsapp";

export function Logo({ store, href, className = "" }: { store: StoreConfig; href: string; className?: string }) {
  return (
    <a className={`logo ${store.logo.subAlign === "right" ? "logo-sub-right" : ""} ${className}`.trim()} href={href} aria-label={store.name}>
      {store.logo.image
        ? <img className="logo-image" src={store.logo.image} alt={store.name} />
        : <><span className="logo-main">{store.logo.main}</span><span className="logo-sub">{store.logo.sub}</span></>}
    </a>
  );
}

export function Footer({ store }: { store: StoreConfig }) {
  const { contact } = store;
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div>
          <Logo store={store} href="/#inicio" className="footer-logo" />
          <p>{store.texts.footer.tagline}</p>
        </div>
        <div>
          <h4>Atendimento</h4>
          <p>WhatsApp: <a href={whatsappUrl(store)} target="_blank" rel="noopener">fale com a gente</a></p>
          {contact.instagramUrl && (
            <p>Instagram: <a href={contact.instagramUrl} target="_blank" rel="noopener">{contact.instagramHandle}</a></p>
          )}
          {contact.email && <p>E-mail: <a href={`mailto:${contact.email}`}>{contact.email}</a></p>}
        </div>
        <div>
          <h4>Informações</h4>
          <a href="/#sobre">Sobre</a>
          {Object.entries(store.pages).map(([slug, page]) => (
            <a key={slug} href={`/institucional/${slug}`}>{page.title}</a>
          ))}
        </div>
      </div>
      <div className="footer-bottom">© {new Date().getFullYear()} {store.name}. Todos os direitos reservados.</div>
    </footer>
  );
}
