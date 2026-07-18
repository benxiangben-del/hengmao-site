import { localizePath, SiteLink } from "../app/router.jsx";
import BrandMark from "./BrandMark.jsx";

export default function SiteFooter({ lang, text, router, brand }) {
  return (
    <footer className="site-footer">
      <div className="site-container footer-grid">
        <div className="footer-brand">
          <BrandMark brand={brand} inverse />
          <p>{lang === "zh" ? brand.zhTagline : brand.enTagline}</p>
        </div>
        <div>
          <h2>{lang === "zh" ? "产品与支持" : "Products & Support"}</h2>
          <SiteLink to={localizePath(lang, "products")} router={router}>{text.nav.products}</SiteLink>
          <SiteLink to={localizePath(lang, "support")} router={router}>{text.nav.support}</SiteLink>
        </div>
        <div>
          <h2>{lang === "zh" ? "关于恒猫" : "About HENGMAO"}</h2>
          <SiteLink to={localizePath(lang, "company")} router={router}>{text.nav.company}</SiteLink>
          <SiteLink to={localizePath(lang, "contact")} router={router}>{text.nav.contact}</SiteLink>
        </div>
        <div className="footer-note">
          <h2>{lang === "zh" ? "内容状态" : "Content status"}</h2>
          <p>{lang === "zh" ? "当前为官网架构与视觉演示，正式产品资料将逐步补充。" : "This is an architecture and visual preview. Verified product content will be added progressively."}</p>
        </div>
      </div>
      <div className="site-container footer-bottom">
        <span>© {new Date().getFullYear()} {brand.enName}</span>
        <span>{lang === "zh" ? "演示版本 · 不作为正式产品说明" : "Demo version · Not final product documentation"}</span>
      </div>
    </footer>
  );
}
