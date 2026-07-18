import { useEffect } from "react";
import { useRouter } from "./app/router.jsx";
import SiteHeader from "./components/SiteHeader.jsx";
import SiteFooter from "./components/SiteFooter.jsx";
import HomePage from "./pages/HomePage.jsx";
import ProductsPage from "./pages/ProductsPage.jsx";
import ProductPage from "./pages/ProductPage.jsx";
import SupportPage from "./pages/SupportPage.jsx";
import CompanyPage from "./pages/CompanyPage.jsx";
import ContactPage from "./pages/ContactPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import { brand, copy } from "./content/demoSite.js";
import { useProductCatalog } from "./hooks/useProductCatalog.js";

const pageTitles = {
  home: { zh: "上海恒猫机电｜洗车机与清洁配件", en: "HENGMAO | Car Washers & Cleaning Accessories" },
  products: { zh: "产品中心｜上海恒猫机电", en: "Products | HENGMAO" },
  product: { zh: "演示产品｜上海恒猫机电", en: "Demo Product | HENGMAO" },
  support: { zh: "安装与支持｜上海恒猫机电", en: "Installation & Support | HENGMAO" },
  company: { zh: "关于恒猫｜上海恒猫机电", en: "About HENGMAO" },
  contact: { zh: "联系我们｜上海恒猫机电", en: "Contact | HENGMAO" },
  notFound: { zh: "页面未找到｜上海恒猫机电", en: "Page Not Found | HENGMAO" },
};

export default function App() {
  const router = useRouter();
  const lang = router.locale === "en" ? "en" : "zh";
  const text = copy[lang];
  const catalog = useProductCatalog(lang);

  useEffect(() => {
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
    const currentProduct = router.route === "product" ? catalog.findBySlug(router.params.slug) : null;
    document.title = currentProduct?.name?.[lang]
      ? `${currentProduct.name[lang]} | HENGMAO`
      : pageTitles[router.route]?.[lang] || pageTitles.notFound[lang];
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [lang, router.route, router.path, router.params.slug, catalog]);

  const pageProps = { lang, text, router, catalog };
  let page;

  switch (router.route) {
    case "home":
      page = <HomePage {...pageProps} />;
      break;
    case "products":
      page = <ProductsPage {...pageProps} />;
      break;
    case "product":
      page = <ProductPage {...pageProps} />;
      break;
    case "support":
      page = <SupportPage {...pageProps} />;
      break;
    case "company":
      page = <CompanyPage {...pageProps} />;
      break;
    case "contact":
      page = <ContactPage {...pageProps} />;
      break;
    default:
      page = <NotFoundPage {...pageProps} />;
  }

  return (
    <div className="site-shell">
      <a className="skip-link" href="#main-content">{text.skipToContent}</a>
      <SiteHeader lang={lang} text={text} router={router} brand={brand} />
      {page}
      <SiteFooter lang={lang} text={text} router={router} brand={brand} />
    </div>
  );
}
