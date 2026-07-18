import { useState } from "react";
import { localizePath, SiteLink } from "../app/router.jsx";
import BrandMark from "./BrandMark.jsx";
import Icon from "./Icon.jsx";

const routePaths = { home: "", products: "products", support: "support", company: "company", contact: "contact" };

export default function SiteHeader({ lang, text, router, brand }) {
  const [open, setOpen] = useState(false);

  function navigateHomeSearch(event) {
    event.preventDefault();
    router.navigate(localizePath(lang, "products"));
    setOpen(false);
  }

  return (
    <header className="site-header">
      <div className="site-container header-inner">
        <SiteLink to={localizePath(lang)} router={router} className="header-brand" onClick={() => setOpen(false)}>
          <BrandMark brand={brand} />
        </SiteLink>
        <nav className={`primary-nav${open ? " is-open" : ""}`} aria-label={lang === "zh" ? "主导航" : "Primary navigation"}>
          {Object.entries(routePaths).map(([key, path]) => (
            <SiteLink key={key} to={localizePath(lang, path)} router={router} className="nav-link" ariaCurrent={router.route === key ? "page" : undefined} onClick={() => setOpen(false)}>
              {text.nav[key]}
            </SiteLink>
          ))}
          <form className="nav-search" onSubmit={navigateHomeSearch} role="search">
            <Icon name="search" size={18} />
            <span>{text.modelSearch}</span>
          </form>
          <button className="language-button" type="button" onClick={() => { router.switchLocale(lang === "zh" ? "en" : "zh"); setOpen(false); }}>
            <Icon name="globe" size={18} /> {text.language}
          </button>
        </nav>
        <button className="mobile-menu-button" type="button" aria-expanded={open} aria-label={text.menu} onClick={() => setOpen((value) => !value)}>
          <Icon name={open ? "close" : "menu"} size={24} />
        </button>
      </div>
    </header>
  );
}
