import { useEffect, useMemo, useState } from "react";
import { demoProduct, heroProducts as demoHeroProducts } from "../content/demoSite.js";
import { isSupabaseConfigured } from "../lib/supabase.js";
import { fetchPublicProductRecords, toPublicProduct } from "../lib/contentApiV2.js";

const demoCatalog = {
  products: [demoProduct],
  heroProducts: demoHeroProducts,
  source: "demo",
  loading: false,
  error: null,
};

function toHeroProduct(product, index) {
  return {
    id: product.id || product.slug,
    image: product.image,
    category: product.category,
    name: product.name,
    model: { zh: product.model, en: product.model },
    size: index === 1 ? "wide" : "standard",
  };
}

export function useProductCatalog(lang) {
  const locale = lang === "en" ? "en" : "zh-CN";
  const [state, setState] = useState(demoCatalog);

  useEffect(() => {
    let active = true;
    if (!isSupabaseConfigured) {
      setState(demoCatalog);
      return () => { active = false; };
    }
    setState((current) => ({ ...current, loading: true, error: null }));
    fetchPublicProductRecords(locale)
      .then((records) => {
        if (!active) return;
        if (!records.length) {
          setState({ ...demoCatalog, source: "demo-empty", loading: false, error: null });
          return;
        }
        const products = records.map(toPublicProduct);
        const featured = products.filter((product) => product.placements?.homeHero).slice(0, 4);
        setState({
          products,
          heroProducts: (featured.length ? featured : products.slice(0, 4)).map(toHeroProduct),
          source: "supabase-v2",
          loading: false,
          error: null,
        });
      })
      .catch((error) => {
        if (active) setState({ ...demoCatalog, source: "demo-fallback", error });
      });
    return () => { active = false; };
  }, [locale]);

  return useMemo(() => ({
    ...state,
    findBySlug: (slug) => state.products.find((product) => product.slug === slug),
    findByModel: (model) => state.products.find((product) => product.model.toLowerCase() === String(model || "").trim().toLowerCase()),
  }), [state]);
}
