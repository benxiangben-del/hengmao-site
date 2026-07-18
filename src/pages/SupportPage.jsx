import ModelSearch from "../components/ModelSearch.jsx";
import EmptyState from "../components/EmptyState.jsx";
import Icon from "../components/Icon.jsx";

export default function SupportPage({ lang, text, router, catalog }) {
  const items = [{ icon: "tool", zh: "安装", en: "Installation" }, { icon: "play", zh: "使用", en: "Operation" }, { icon: "shield", zh: "安全", en: "Safety" }, { icon: "book", zh: "维护与下载", en: "Maintenance & Downloads" }];
  return <main id="main-content"><section className="page-hero page-hero--support"><div className="site-container"><p className="eyebrow eyebrow--light">SUPPORT</p><h1>{text.nav.support}</h1><p>{lang === "zh" ? "输入产品型号，查找与设备准确对应的安装、使用和维护资料。" : "Enter a model to find installation, operation and maintenance content matched to the exact product."}</p><ModelSearch lang={lang} text={text} router={router} catalog={catalog} /></div></section><section className="section"><div className="site-container"><div className="support-grid">{items.map((item) => <article className="support-card support-card--large" key={item.en}><span><Icon name={item.icon} size={26} /></span><h2>{item[lang]}</h2><p>{text.notProvided}</p></article>)}</div><div className="section-spacer"><EmptyState lang={lang} title={lang === "zh" ? "常见问题与资料下载" : "FAQ & Downloads"} /></div></div></section></main>;
}
