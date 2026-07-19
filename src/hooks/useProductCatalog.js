import { useEffect, useMemo, useState } from "react";
import { demoProduct, heroProducts as demoHeroProducts } from "../content/demoSite.js";
import { normalizeCatalogDocument, publicRecordsForLocale, toPublicProduct } from "../content/productModel.js";

const demoCatalog = {
  products: [demoProduct],
  heroProducts: demoHeroProducts,
  heroDemoMode: true,
  source: "demo",
  loading: false,
  error: null,
};

function toHeroProduct(product, index) {
  return {
    id: product.id || product.slug,
    image: product.heroImage,
    category: product.category,
    name: product.name,
    model: { zh: product.model, en: product.model },
    size: index === 1 ? "wide" : "standard",
  };
}

export function useProductCatalog(lang) {
  const locale = lang === "en" ? "en" : "zh-CN";
  const [state, setState] = useState({ ...demoCatalog, loading: true });

  useEffect(() => {
    let active = true;
    setState((current) => ({ ...current, loading: true, error: null }));
    fetch(`/content/catalog.json?catalog=${Date.now()}`, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error(`静态产品目录读取失败（HTTP ${response.status}）`);
        return response.json();
      })
      .then((value) => {
        if (!active) return;
        const document = normalizeCatalogDocument(value);
        const records = publicRecordsForLocale(document.products, locale);
        if (!records.length) {
          setState({ ...demoCatalog, source: "static-demo", loading: false, error: null });
          return;
        }
        const products = records.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)).map(toPublicProduct);
        const featured = products
          .filter((product) => product.placements?.homeHero && product.heroImage)
          .sort((a, b) => (a.placements.homeHeroOrder || 0) - (b.placements.homeHeroOrder || 0))
          .slice(0, 4);
        setState({
          products,
          heroProducts: featured.length ? featured.map(toHeroProduct) : demoHeroProducts,
          heroDemoMode: featured.length === 0,
          source: "static-content",
          loading: false,
          error: null,
        });
      })
      .catch((error) => {
        if (active) setState({ ...demoCatalog, source: "static-fallback", loading: false, error });
      });
    return () => { active = false; };
  }, [locale]);

  return useMemo(() => ({
    ...state,
    findBySlug: (slug) => state.products.find((product) => product.slug === slug),
    findByModel: (model) => state.products.find((product) => product.model.toLowerCase() === String(model || "").trim().toLowerCase()),
  }), [state]);
}
