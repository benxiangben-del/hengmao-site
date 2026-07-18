import { useState } from "react";
import { localizePath } from "../app/router.jsx";
import Icon from "./Icon.jsx";

export default function ModelSearch({ lang, text, router, compact = false }) {
  const [query, setQuery] = useState("");

  function submit(event) {
    event.preventDefault();
    router.navigate(localizePath(lang, query.trim() ? "products/demo-portable-washer" : "products"));
  }

  return (
    <form className={`model-search${compact ? " model-search--compact" : ""}`} onSubmit={submit} role="search">
      <label htmlFor={compact ? "support-search" : "hero-search"}>{text.modelSearch}</label>
      <div className="model-search-row">
        <Icon name="search" size={22} />
        <input id={compact ? "support-search" : "hero-search"} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={text.searchPlaceholder} />
        <button type="submit">{text.searchAction}<Icon name="arrow" size={18} /></button>
      </div>
      <p>{lang === "zh" ? "演示阶段输入任意内容将打开样板产品页。" : "During this demo, any query opens the sample product page."}</p>
    </form>
  );
}
