import { useState } from "react";
import { localizePath } from "../app/router.jsx";
import Icon from "./Icon.jsx";

export default function ModelSearch({ lang, text, router, catalog, compact = false }) {
  const [query, setQuery] = useState("");

  function submit(event) {
    event.preventDefault();
    const product = catalog?.findByModel(query) || catalog?.products?.find((item) => item.slug === query.trim().toLowerCase());
    router.navigate(localizePath(lang, product ? `products/${product.slug}` : "products"));
  }

  return (
    <form className={`model-search${compact ? " model-search--compact" : ""}`} onSubmit={submit} role="search">
      <label htmlFor={compact ? "support-search" : "hero-search"}>{text.modelSearch}</label>
      <div className="model-search-row">
        <Icon name="search" size={22} />
        <input id={compact ? "support-search" : "hero-search"} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={text.searchPlaceholder} />
        <button type="submit">{text.searchAction}<Icon name="arrow" size={18} /></button>
      </div>
      <p>{lang === "zh" ? "输入完整型号可直接打开对应产品；未找到时进入产品中心。" : "Enter an exact model to open the matching product; unmatched searches open the catalog."}</p>
    </form>
  );
}
