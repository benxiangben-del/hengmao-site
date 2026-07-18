import ProductCard from "../components/ProductCard.jsx";
import ModelSearch from "../components/ModelSearch.jsx";

export default function ProductsPage({ lang, text, router, catalog }) {
  return (
    <main id="main-content">
      <section className="page-hero"><div className="site-container"><p className="eyebrow eyebrow--light">PRODUCTS</p><h1>{text.nav.products}</h1><p>{lang === "zh" ? "按分类、名称或型号查找设备和配件。只展示当前语言已经审核发布的正式内容。" : "Find equipment and accessories by category, name or model. Only content published for the current language is shown."}</p></div></section>
      <section className="section section--compact"><div className="site-container"><ModelSearch lang={lang} text={text} router={router} catalog={catalog} compact /><div className="filter-row"><button className="filter-chip is-active">{lang === "zh" ? "全部" : "All"}</button><button className="filter-chip">{lang === "zh" ? "便携式设备" : "Portable"}</button><button className="filter-chip">{lang === "zh" ? "推车式设备" : "Trolley"}</button><button className="filter-chip">{lang === "zh" ? "配件" : "Accessories"}</button></div><div className="catalog-grid">{catalog.products.map((product) => <ProductCard key={product.id || product.slug} product={product} lang={lang} text={text} router={router} />)}</div></div></section>
    </main>
  );
}
