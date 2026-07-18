import { localizePath, SiteLink } from "../app/router.jsx";
import { demoProduct } from "../content/demoSite.js";
import EmptyState from "../components/EmptyState.jsx";
import Icon from "../components/Icon.jsx";

export default function ProductPage({ lang, text, router }) {
  if (router.params.slug !== demoProduct.slug) return <main id="main-content" className="section"><div className="site-container"><EmptyState lang={lang} title={lang === "zh" ? "未找到这个产品" : "Product not found"} /></div></main>;
  return (
    <main id="main-content">
      <div className="site-container breadcrumb"><SiteLink to={localizePath(lang)} router={router}>{text.nav.home}</SiteLink><span>/</span><SiteLink to={localizePath(lang, "products")} router={router}>{text.nav.products}</SiteLink><span>/</span><strong>{demoProduct.name[lang]}</strong></div>
      <section className="product-overview"><div className="site-container product-overview-grid">
        <div className="product-gallery"><span className="status-badge">{text.demo}</span><img src={demoProduct.image} alt={demoProduct.name[lang]} /><div className="thumbnail-row"><button className="thumbnail is-active"><img src={demoProduct.image} alt="" /></button></div></div>
        <div className="product-summary"><p className="eyebrow">{demoProduct.category[lang]}</p><h1>{demoProduct.name[lang]}</h1><p className="model-line">{lang === "zh" ? "型号" : "Model"}: <strong>{demoProduct.model}</strong></p><p className="lead-copy">{demoProduct.summary[lang]}</p><div className="pending-panel"><Icon name="book" size={22} /><div><strong>{lang === "zh" ? "参数等待确认" : "Specifications pending"}</strong><p>{text.notProvided}</p></div></div><div className="product-actions"><a className="button button--primary" href="#product-video"><Icon name="play" size={18} />{lang === "zh" ? "查看演示视频" : "View demo video"}</a><button className="button button--secondary" disabled><Icon name="download" size={18} />{lang === "zh" ? "说明书待提供" : "Manual pending"}</button></div></div>
      </div></section>

      <section className="section"><div className="site-container product-detail-layout"><aside className="detail-nav"><strong>{lang === "zh" ? "本页内容" : "On this page"}</strong><a href="#specifications">{lang === "zh" ? "技术参数" : "Specifications"}</a><a href="#installation">{lang === "zh" ? "安装方法" : "Installation"}</a><a href="#safety">{lang === "zh" ? "安全事项" : "Safety"}</a><a href="#product-video">{lang === "zh" ? "产品视频" : "Product video"}</a></aside><div className="detail-content">
        <section id="specifications" className="detail-section"><p className="eyebrow">SPECIFICATIONS</p><h2>{lang === "zh" ? "技术参数" : "Technical specifications"}</h2><EmptyState lang={lang} title={text.pending} /></section>
        <section id="installation" className="detail-section"><p className="eyebrow">INSTALLATION & USE</p><h2>{lang === "zh" ? "安装与使用" : "Installation & use"}</h2><div className="step-list"><div className="step-item"><span>01</span><div><h3>{lang === "zh" ? "确认产品型号" : "Confirm the product model"}</h3><p>{lang === "zh" ? "正式步骤将与具体型号绑定，避免不同设备使用错误说明。" : "Final steps will be matched to the exact model to prevent incorrect instructions."}</p></div></div><div className="step-item is-pending"><span>02</span><div><h3>{text.pending}</h3><p>{text.notProvided}</p></div></div></div></section>
        <section id="safety" className="detail-section"><p className="eyebrow">SAFETY</p><h2>{lang === "zh" ? "安全事项" : "Safety information"}</h2><div className="safety-notice"><Icon name="shield" size={24} /><div><strong>{lang === "zh" ? "发布前必须进行技术审核" : "Technical review required before publication"}</strong><p>{lang === "zh" ? "当前不展示推测性的压力、电气或操作警告。资料确认后，这里会呈现与型号对应的安全说明。" : "No assumed pressure, electrical or operating warnings are shown. Model-specific safety information will appear here after verification."}</p></div></div></section>
        <section id="product-video" className="detail-section"><p className="eyebrow">VIDEO</p><h2>{lang === "zh" ? "产品演示视频" : "Product demo video"}</h2><p>{lang === "zh" ? "该视频来源于现有资料，目前尚未确认适用型号和内容类型，仅用于验证播放器布局。" : "This video comes from the existing asset folder. Its model and content type are not yet verified, so it is used only to demonstrate the player layout."}</p><video className="product-video" controls preload="metadata" src={demoProduct.video}>{lang === "zh" ? "浏览器不支持视频播放。" : "Your browser does not support video playback."}</video></section>
      </div></div></section>
    </main>
  );
}
