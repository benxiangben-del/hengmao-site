import ProductCard from "../components/ProductCard.jsx";
import ModelSearch from "../components/ModelSearch.jsx";
import { demoProduct } from "../content/demoSite.js";

export default function ProductsPage({ lang, text, router }) {
  return (
    <main id="main-content">
      <section className="page-hero"><div className="site-container"><p className="eyebrow eyebrow--light">PRODUCTS</p><h1>{text.nav.products}</h1><p>{lang === "zh" ? "按分类、名称或型号查找设备和配件。当前展示一个用于验证页面架构的样板产品。" : "Find equipment and accessories by category, name or model. One sample product is currently used to demonstrate the site architecture."}</p></div></section>
      <section className="section section--compact"><div className="site-container"><ModelSearch lang={lang} text={text} router={router} compact /><div className="filter-row"><button className="filter-chip is-active">{lang === "zh" ? "全部" : "All"}</button><button className="filter-chip">{lang === "zh" ? "便携式设备" : "Portable"}</button><button className="filter-chip">{lang === "zh" ? "推车式设备" : "Trolley"}</button><button className="filter-chip">{lang === "zh" ? "配件" : "Accessories"}</button></div><div className="catalog-grid"><ProductCard product={demoProduct} lang={lang} text={text} router={router} /></div></div></section>
    </main>
  );
}
