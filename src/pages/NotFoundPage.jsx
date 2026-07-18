import { localizePath, SiteLink } from "../app/router.jsx";

export default function NotFoundPage({ lang, text, router }) {
  return <main id="main-content" className="not-found"><div className="site-container"><span>404</span><h1>{lang === "zh" ? "页面未找到" : "Page not found"}</h1><p>{lang === "zh" ? "这个链接可能已变更。你可以返回首页或进入产品中心。" : "This link may have changed. Return home or continue to the product center."}</p><div className="hero-actions"><SiteLink className="button button--primary" to={localizePath(lang)} router={router}>{text.nav.home}</SiteLink><SiteLink className="button button--secondary" to={localizePath(lang, "products")} router={router}>{text.nav.products}</SiteLink></div></div></main>;
}
