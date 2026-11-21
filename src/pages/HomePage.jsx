import { localizePath, SiteLink } from "../app/router.jsx";
import { brand } from "../content/demoSite.js";
import ModelSearch from "../components/ModelSearch.jsx";
import ProductCard from "../components/ProductCard.jsx";
import Icon from "../components/Icon.jsx";
import ParticleField from "../components/ParticleField.jsx";
import HeroProductCarousel from "../components/HeroProductCarousel.jsx";

export default function HomePage({ lang, text, router, catalog }) {
  const supportItems = [
    { icon: "tool", zh: "安装方法", en: "Installation", zhText: "按型号查找组装、连接与首次启动步骤。", enText: "Find assembly, connection and first-start steps by model." },
    { icon: "play", zh: "使用视频", en: "How-to Videos", zhText: "观看与实际型号对应的操作演示。", enText: "Watch operating videos matched to the exact model." },
    { icon: "shield", zh: "安全事项", en: "Safety", zhText: "了解使用限制、警告和日常检查。", enText: "Review operating limits, warnings and routine checks." },
    { icon: "book", zh: "说明书下载", en: "Manuals", zhText: "获取最新版本的说明书和参数资料。", enText: "Download the latest manuals and specification sheets." },
  ];

  return (
    <main id="main-content">
      <section className="home-hero">
        <ParticleField />
        <div className="hero-grid-overlay" aria-hidden="true" />
        <div className="site-container hero-layout">
          <div className="hero-copy">
            <p className="eyebrow eyebrow--light">{lang === "zh" ? "清洁设备 · 产品与支持" : "Cleaning Equipment · Products & Support"}</p>
            <h1>{lang === "zh" ? "可靠设备，\n清洁更高效" : "Reliable Equipment.\nCleaner Results."}</h1>
            <p className="hero-lead">{lang === "zh" ? "从产品选型到安装使用，为国内外客户提供清晰、准确、可持续更新的产品资料。" : "Clear, accurate and maintainable product information—from selection to installation and everyday use—for customers worldwide."}</p>
            <div className="hero-actions">
              <SiteLink className="button button--primary" to={localizePath(lang, "products")} router={router}>{text.viewProducts}<Icon name="arrow" size={18} /></SiteLink>
              <SiteLink className="button button--ghost" to={localizePath(lang, "support")} router={router}>{text.getSupport}</SiteLink>
            </div>
          </div>
          <HeroProductCarousel lang={lang} text={text} products={catalog.heroProducts} demoMode={catalog.heroDemoMode} />
        </div>
      </section>

      <section className="search-band">
        <div className="site-container"><ModelSearch lang={lang} text={text} router={router} catalog={catalog} /></div>
      </section>

      <section className="section">
        <div className="site-container">
          <div className="section-heading split-heading">
            <div><p className="eyebrow">{lang === "zh" ? "PRODUCTS" : "PRODUCTS"}</p><h2>{lang === "zh" ? "找到适合的清洁设备" : "Find the right cleaning equipment"}</h2></div>
            <p>{catalog.source === "static-content" ? (lang === "zh" ? "这里展示内容工作台中已正式发布并通过当前语言审核的产品。" : "Products published and approved for the current language in the content workbench are shown here.") : (lang === "zh" ? "当前使用演示产品验证完整页面结构；正式产品发布后将自动替换演示内容。" : "Demo content validates the page structure and is replaced automatically when formal products are published.")}</p>
          </div>
          <div className="catalog-grid">{catalog.products.slice(0, 3).map((product) => <ProductCard key={product.id || product.slug} product={product} lang={lang} text={text} router={router} />)}</div>
        </div>
      </section>

      <section className="section section--soft">
        <div className="site-container">
          <div className="section-heading centered-heading">
            <p className="eyebrow">{lang === "zh" ? "PRODUCT SUPPORT" : "PRODUCT SUPPORT"}</p>
            <h2>{lang === "zh" ? "买到产品之后，也能快速找到答案" : "Support that continues after purchase"}</h2>
            <p>{lang === "zh" ? "围绕具体型号组织安装、使用、安全、维护和下载资料。" : "Installation, use, safety, maintenance and downloads organized around the exact product model."}</p>
          </div>
          <div className="support-grid">
            {supportItems.map((item) => <article className="support-card" key={item.en}><span><Icon name={item.icon} size={24} /></span><h3>{item[lang]}</h3><p>{lang === "zh" ? item.zhText : item.enText}</p></article>)}
          </div>
          <div className="center-action"><SiteLink className="button button--secondary" to={localizePath(lang, "support")} router={router}>{text.getSupport}<Icon name="arrow" size={18} /></SiteLink></div>
        </div>
      </section>

      <section className="section trust-section">
        <div className="site-container trust-layout">
          <div>
            <p className="eyebrow eyebrow--light">{brand.wordmark}</p>
            <h2>{lang === "zh" ? "真实资料，构成长期信任" : "Trust built on verified information"}</h2>
            <p>{lang === "zh" ? "工厂、证书、专利、生产能力和客户案例的展示区域已经规划完成。资料尚未提供时保持空白，不使用虚构数字。" : "The structure is ready for factory, certificate, patent, capacity and case evidence. Until verified materials are provided, no fabricated claims or figures will be shown."}</p>
            <SiteLink className="text-link text-link--light" to={localizePath(lang, "company")} router={router}>{text.nav.company}<Icon name="arrow" size={18} /></SiteLink>
          </div>
          <div className="trust-placeholder">
            <span><Icon name="factory" size={32} /></span>
            <strong>{text.pending}</strong>
            <small>{lang === "zh" ? "工厂 · 证书 · 专利 · 案例" : "Factory · Certificates · Patents · Cases"}</small>
          </div>
        </div>
      </section>
    </main>
  );
}
