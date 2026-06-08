import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import {
  fetchProductById,
  fetchProductByModel,
  fetchProducts,
  fetchSiteSettings,
} from "./lib/siteApi.js";

const CATEGORY_LABELS = {
  portable: { zh: "手提式洗车机", en: "Portable Car Washer" },
  trolley: { zh: "推车款洗车机", en: "Trolley Pressure Washer" },
  "water-gun": { zh: "水枪", en: "Spray Gun" },
  "high-pressure-hose": { zh: "高压管", en: "High Pressure Hose" },
  "steel-wire-hose": { zh: "钢丝管", en: "Steel Wire Hose" },
};

const DEFAULT_SETTINGS = {
  branding: {
    zhName: "上海恒猫机电",
    enName: "Shanghai Hengmao Machinery",
    zhSub: "洗车机与清洁配件供应商",
    enSub: "Car Washer and Cleaning Accessories Supplier",
  },
  home: {
    heroTag: "专业清洁设备供应商",
    heroTagZh: "专业清洁设备供应商",
    heroTagEn: "Professional Cleaning Equipment Supplier",
    heroTitle: "洗车机与清洁配件解决方案",
    heroTitleZh: "洗车机与清洁配件解决方案",
    heroTitleEn: "Car Washer and Cleaning Accessory Solutions",
    heroDesc:
      "上海恒猫机电主营手提式洗车机、推车款洗车机、水枪、高压管、钢丝管等产品，支持产品展示、型号搜索与安装视频管理。",
    heroDescZh:
      "上海恒猫机电主营手提式洗车机、推车款洗车机、水枪、高压管、钢丝管等产品，支持产品展示、型号搜索与安装视频管理。",
    heroDescEn:
      "Shanghai Hengmao Machinery supplies portable car washers, trolley pressure washers, spray guns, high pressure hoses, and steel wire hoses with product display, model search, and installation video management.",
  },
  about: {
    title: "公司介绍",
    body: "上海恒猫机电专注于洗车机及清洁配件的展示与供应，主要产品包括手提式洗车机、推车款洗车机、水枪、高压管和钢丝管等。",
  },
  contact: {
    email: "sales@hengmao.com",
    phone: "+86-000-0000-0000",
    address: "中国上海",
    description: "欢迎联系上海恒猫机电获取产品资料和报价支持。",
  },
};

const DEFAULT_SUPPORT_SETTINGS = {
  support: {
    searchDesc: "输入产品型号，快速找到对应产品和安装视频。",
    videoCta: "查看安装视频",
  },
  faq: [],
};

const UI = {
  zh: {
    home: "首页",
    about: "公司介绍",
    products: "产品中心",
    support: "帮助",
    contact: "联系我们",
    switchLabel: "EN",
    all: "全部",
    featured: "推荐产品",
    productCenterTitle: "产品中心",
    productCenterDesc: "所有产品数据来自 Supabase，后台修改后前台自动更新。",
    detail: "查看详情",
    backToProducts: "返回产品中心",
    detailIntroTitle: "产品介绍",
    detailFeatureTitle: "产品特点",
    detailSpecTitle: "产品参数",
    detailVideoTitle: "安装视频",
    searchTitle: "型号搜索",
    searchDesc: "输入产品型号，快速找到对应产品和安装视频。",
    searchPlaceholder: "请输入产品型号，例如 HM-P1200",
    searchResult: "搜索结果",
    searchEmpty: "未找到对应产品",
    watchVideo: "查看视频",
    noProducts: "暂无产品",
    loading: "正在读取产品...",
    error: "读取 Supabase 数据失败，请检查环境变量、数据库表和 RLS 策略。",
    activeProducts: "产品数量",
    categoryCount: "产品分类",
  },
  en: {
    home: "Home",
    about: "About",
    products: "Products",
    support: "Support",
    contact: "Contact",
    switchLabel: "中文",
    all: "All",
    featured: "Featured",
    productCenterTitle: "Product Center",
    productCenterDesc: "Product data is loaded from Supabase and updates after admin changes.",
    detail: "View Detail",
    backToProducts: "Back to Products",
    detailIntroTitle: "Description",
    detailFeatureTitle: "Features",
    detailSpecTitle: "Specifications",
    detailVideoTitle: "Installation Video",
    searchTitle: "Model Search",
    searchDesc: "Search by model number to find product details and installation videos.",
    searchPlaceholder: "Enter model, for example HM-P1200",
    searchResult: "Results",
    searchEmpty: "No matching product",
    watchVideo: "Watch Video",
    noProducts: "No products yet",
    loading: "Loading products...",
    error: "Failed to load Supabase data. Check environment variables, tables, and RLS policies.",
    activeProducts: "Products",
    categoryCount: "Categories",
  },
};

function normalizeSearchValue(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[\s_-]+/g, "")
    .trim();
}

function getCategoryLabel(category, lang) {
  return CATEGORY_LABELS[category]?.[lang] || category || "-";
}

function getLocalizedHome(home, field, lang) {
  const suffix = lang === "en" ? "En" : "Zh";
  return home?.[`${field}${suffix}`] || home?.[field] || "";
}

function productImages(product) {
  const images = [product.cover_url, ...(product.images || [])].filter(Boolean);
  return images.length ? [...new Set(images)] : [];
}

function buildProductSearchIndex(product) {
  return normalizeSearchValue(
    [
      product.name,
      product.model,
      product.category,
      getCategoryLabel(product.category, "zh"),
      getCategoryLabel(product.category, "en"),
      product.short_description,
      product.description,
      ...(product.features || []),
      ...Object.entries(product.specs || {}).flat(),
    ].join(" "),
  );
}

function App() {
  const [lang, setLang] = useState("zh");
  const [page, setPage] = useState("home");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingVideoFocus, setPendingVideoFocus] = useState(false);
  const detailVideoRef = useRef(null);

  const text = UI[lang];

  useEffect(() => {
    let alive = true;

    async function loadSite() {
      try {
        setLoading(true);
        setError("");
        const [nextProducts, nextSettings] = await Promise.all([
          fetchProducts({ activeOnly: true }),
          fetchSiteSettings(),
        ]);
        if (!alive) {
          return;
        }
        setProducts(nextProducts);
        setSettings({
          ...DEFAULT_SETTINGS,
          ...DEFAULT_SUPPORT_SETTINGS,
          ...nextSettings,
          branding: { ...DEFAULT_SETTINGS.branding, ...(nextSettings.branding || {}) },
          home: { ...DEFAULT_SETTINGS.home, ...(nextSettings.home || {}) },
          about: { ...DEFAULT_SETTINGS.about, ...(nextSettings.about || {}) },
          contact: { ...DEFAULT_SETTINGS.contact, ...(nextSettings.contact || {}) },
          support: { ...DEFAULT_SUPPORT_SETTINGS.support, ...(nextSettings.support || {}) },
          faq: Array.isArray(nextSettings.faq) ? nextSettings.faq : DEFAULT_SUPPORT_SETTINGS.faq,
        });
      } catch (loadError) {
        if (alive) {
          setError(loadError?.message || text.error);
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }

    loadSite();
    return () => {
      alive = false;
    };
  }, [text.error]);

  useEffect(() => {
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
    document.title = lang === "zh" ? settings.branding.zhName : settings.branding.enName;
  }, [lang, settings.branding.enName, settings.branding.zhName]);

  const categories = useMemo(() => {
    const keys = [...new Set(products.map((product) => product.category).filter(Boolean))];
    return [
      { key: "all", label: text.all },
      ...keys.map((key) => ({ key, label: getCategoryLabel(key, lang) })),
    ];
  }, [lang, products, text.all]);

  const filteredProducts = useMemo(() => {
    if (category === "all") {
      return products;
    }
    return products.filter((product) => product.category === category);
  }, [category, products]);

  const storyProducts = products.slice(0, 3);

  const videoResults = useMemo(() => {
    const rawKeyword = query.trim();
    if (!rawKeyword) {
      return products;
    }

    const keyword = normalizeSearchValue(rawKeyword);
    return products.filter((product) => buildProductSearchIndex(product).includes(keyword));
  }, [products, query]);

  useEffect(() => {
    if (page !== "detail" || !selectedProduct || !pendingVideoFocus) {
      return;
    }

    const timer = window.setTimeout(() => {
      detailVideoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      setPendingVideoFocus(false);
    }, 120);

    return () => window.clearTimeout(timer);
  }, [page, pendingVideoFocus, selectedProduct]);

  const navigate = (nextPage) => {
    setIsMobileMenuOpen(false);
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openProduct = async (product, options = {}) => {
    setSelectedProduct(product);
    setSelectedImage(0);
    setPage("detail");
    setPendingVideoFocus(Boolean(options.focusVideo));
    window.scrollTo({ top: 0, behavior: options.focusVideo ? "auto" : "smooth" });

    try {
      const hydrated = await fetchProductById(product.id);
      if (hydrated) {
        setSelectedProduct(hydrated);
      }
    } catch {
      setSelectedProduct(product);
    }
  };

  const searchExactModel = async () => {
    if (!query.trim()) {
      return;
    }
    try {
      const found = await fetchProductByModel(query.trim());
      if (found) {
        openProduct(found, { focusVideo: true });
      }
    } catch {
      // The live result list still gives the user a useful fallback.
    }
  };

  const selectedImages = selectedProduct ? productImages(selectedProduct) : [];

  const nextImage = () => {
    if (!selectedImages.length) {
      return;
    }
    setSelectedImage((current) => (current + 1) % selectedImages.length);
  };

  const previousImage = () => {
    if (!selectedImages.length) {
      return;
    }
    setSelectedImage((current) => (current - 1 + selectedImages.length) % selectedImages.length);
  };

  return (
    <div className="site-shell">
      <header className="topbar">
        <button className="brand" onClick={() => navigate("home")}>
          <span className="brand-mark">HM</span>
          <span>
            <strong>{lang === "zh" ? settings.branding.zhName : settings.branding.enName}</strong>
            <small>{lang === "zh" ? settings.branding.zhSub : settings.branding.enSub}</small>
          </span>
        </button>

        <div className="topbar-right">
          <button
            className="mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen((current) => !current)}
            aria-expanded={isMobileMenuOpen}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          >
            <span />
            <span />
            <span />
          </button>

          <nav className={isMobileMenuOpen ? "nav open" : "nav"}>
            <button onClick={() => navigate("home")}>{text.home}</button>
            <button onClick={() => navigate("about")}>{text.about}</button>
            <button onClick={() => navigate("products")}>{text.products}</button>
            <button onClick={() => navigate("support")}>{text.support}</button>
            <button onClick={() => navigate("contact")}>{text.contact}</button>
          </nav>

          <button
            className="lang-switch"
            onClick={() => {
              setLang(lang === "zh" ? "en" : "zh");
              setIsMobileMenuOpen(false);
            }}
          >
            {text.switchLabel}
          </button>
        </div>
      </header>

      {error ? <div className="empty-state">{text.error}</div> : null}
      {loading ? <div className="empty-state">{text.loading}</div> : null}

      {page === "home" && !loading && (
        <main>
          <section className="hero">
            <div className="hero-copy">
              <p className="eyebrow">{getLocalizedHome(settings.home, "heroTag", lang)}</p>
              <h1>{getLocalizedHome(settings.home, "heroTitle", lang)}</h1>
              <p className="lead">{getLocalizedHome(settings.home, "heroDesc", lang)}</p>
              <div className="hero-actions">
                <button className="primary-btn" onClick={() => navigate("products")}>
                  {text.products}
                </button>
                <button className="secondary-btn" onClick={() => navigate("support")}>
                  {text.support}
                </button>
              </div>
            </div>

            <div className="hero-panel">
              {products[0]?.cover_url ? <img src={products[0].cover_url} alt="" /> : <div className="empty-state">{text.noProducts}</div>}
              <div className="hero-stats">
                <div>
                  <strong>{products.length}</strong>
                  <span>{text.activeProducts}</span>
                </div>
                <div>
                  <strong>{Math.max(categories.length - 1, 0)}</strong>
                  <span>{text.categoryCount}</span>
                </div>
                <button className="hero-stat-button" onClick={() => navigate("support")}>
                  <strong>Help</strong>
                  <span>{text.searchTitle}</span>
                </button>
              </div>
            </div>
          </section>

          <section className="section">
            <div className="section-heading">
              <p className="eyebrow">{settings.about.title}</p>
              <h2>{lang === "zh" ? settings.branding.zhName : settings.branding.enName}</h2>
              <p>{settings.about.body}</p>
            </div>
            <div className="feature-grid">
              {Object.values(CATEGORY_LABELS).slice(0, 3).map((item) => (
                <article key={item.zh} className="card">
                  <h3>{lang === "zh" ? item.zh : item.en}</h3>
                  <p>{text.productCenterDesc}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="section section-alt product-home-section">
            <div className="section-heading">
              <p className="eyebrow">{text.featured}</p>
              <h2>{text.productCenterTitle}</h2>
              <p>{text.productCenterDesc}</p>
            </div>
            {storyProducts.length ? (
              <ProductShowcase products={storyProducts} lang={lang} text={text} onOpen={openProduct} />
            ) : (
              <div className="empty-state">{text.noProducts}</div>
            )}
            <ProductGrid products={products} lang={lang} text={text} onOpen={openProduct} />
          </section>
        </main>
      )}

      {page === "about" && (
        <main className="page">
          <div className="section-heading compact">
            <p className="eyebrow">{text.about}</p>
            <h1>{settings.about.title}</h1>
          </div>
          <section className="about-layout">
            <article className="card card-large">
              <p>{settings.about.body}</p>
            </article>
            <div className="stack">
              {Object.values(CATEGORY_LABELS).map((item) => (
                <article key={item.zh} className="card">
                  <h3>{lang === "zh" ? item.zh : item.en}</h3>
                </article>
              ))}
            </div>
          </section>
        </main>
      )}

      {page === "products" && (
        <main className="page">
          <div className="section-heading compact">
            <p className="eyebrow">{text.products}</p>
            <h1>{text.productCenterTitle}</h1>
            <p>{text.productCenterDesc}</p>
          </div>

          <div className="tabs tabs-six">
            {categories.map((item) => (
              <button
                key={item.key}
                className={category === item.key ? "tab active" : "tab"}
                onClick={() => setCategory(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <ProductGrid products={filteredProducts} lang={lang} text={text} onOpen={openProduct} />
        </main>
      )}

      {page === "detail" && selectedProduct && (
        <main className="page detail-page">
          <button className="text-btn" onClick={() => navigate("products")}>
            {text.backToProducts}
          </button>

          <div className="detail-layout">
            <div className="gallery">
              <div className="gallery-main">
                {selectedImages[selectedImage] ? (
                  <img src={selectedImages[selectedImage]} alt={selectedProduct.name} />
                ) : (
                  <div className="empty-state">{text.noProducts}</div>
                )}
                {selectedImages.length > 1 ? (
                  <>
                    <button className="gallery-arrow left" onClick={previousImage}>
                      {"<"}
                    </button>
                    <button className="gallery-arrow right" onClick={nextImage}>
                      {">"}
                    </button>
                  </>
                ) : null}
              </div>

              <div className="thumb-row">
                {selectedImages.map((image, index) => (
                  <button
                    key={image}
                    className={selectedImage === index ? "thumb active" : "thumb"}
                    onClick={() => setSelectedImage(index)}
                  >
                    <img src={image} alt="" />
                  </button>
                ))}
              </div>
            </div>

            <div className="detail-copy">
              <p className="eyebrow">{selectedProduct.model}</p>
              <h1>{selectedProduct.name}</h1>
              <div className="price-chip">
                <span>{text.categoryCount}</span>
                <strong>{getCategoryLabel(selectedProduct.category, lang)}</strong>
              </div>

              <section className="detail-block">
                <h3>{text.detailIntroTitle}</h3>
                <p>{selectedProduct.description || selectedProduct.short_description}</p>
              </section>

              <section className="detail-block">
                <h3>{text.detailFeatureTitle}</h3>
                <ul className="feature-list">
                  {(selectedProduct.features || []).map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              </section>

              <section className="detail-block">
                <h3>{text.detailSpecTitle}</h3>
                <div className="spec-table">
                  {Object.entries(selectedProduct.specs || {}).map(([label, value]) => (
                    <div key={`${label}-${value}`} className="spec-row">
                      <span>{label}</span>
                      <strong>{String(value)}</strong>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>

          {selectedProduct.video_url ? (
            <section ref={detailVideoRef} className="section detail-video-section">
              <div className="section-heading compact">
                <p className="eyebrow">{selectedProduct.model}</p>
                <h2>{text.detailVideoTitle}</h2>
              </div>
              <video controls className="video-player" src={selectedProduct.video_url}>
                Your browser does not support video playback.
              </video>
            </section>
          ) : null}
        </main>
      )}

      {page === "support" && (
        <main className="page">
          <div className="section-heading compact">
            <p className="eyebrow">{text.support}</p>
            <h1>{text.searchTitle}</h1>
            <p>{settings.support?.searchDesc || text.searchDesc}</p>
          </div>

          <div className="search-panel">
            <input
              className="search-input"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  searchExactModel();
                }
              }}
              placeholder={text.searchPlaceholder}
            />
          </div>

          <section className="result-panel">
            <h2>{text.searchResult}</h2>
            {videoResults.length > 0 ? (
              <div className="search-results">
                {videoResults.map((product) => (
                  <article
                    key={product.id}
                    className="result-card result-card-clickable"
                    onClick={() => openProduct(product, { focusVideo: true })}
                  >
                    {product.cover_url ? <img src={product.cover_url} alt={product.name} /> : null}
                    <div className="result-copy">
                      <p>{product.model}</p>
                      <h3>{product.name}</h3>
                      <span>{product.short_description}</span>
                      <p>{getCategoryLabel(product.category, lang)}</p>
                    </div>
                    <button
                      className="primary-btn"
                      onClick={(event) => {
                        event.stopPropagation();
                        openProduct(product, { focusVideo: true });
                      }}
                    >
                      {settings.support?.videoCta || text.watchVideo}
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state">{text.searchEmpty}</div>
            )}
          </section>
          {settings.faq?.length ? (
            <section className="section">
              <div className="section-heading compact">
                <p className="eyebrow">FAQ</p>
                <h2>常见问题</h2>
              </div>
              <div className="feature-grid">
                {settings.faq.map((item, index) => (
                  <article className="card" key={`${item.question}-${index}`}>
                    <h3>{item.question}</h3>
                    <p>{item.answer}</p>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </main>
      )}

      {page === "contact" && (
        <main className="page">
          <div className="section-heading compact">
            <p className="eyebrow">{text.contact}</p>
            <h1>{lang === "zh" ? "联系我们" : "Contact Us"}</h1>
            <p>{settings.contact.description}</p>
          </div>
          <section className="contact-grid">
            <article className="card">
              <h3>Email</h3>
              <p>{settings.contact.email}</p>
            </article>
            <article className="card">
              <h3>Phone / WhatsApp</h3>
              <p>{settings.contact.phone}</p>
            </article>
            <article className="card">
              <h3>{lang === "zh" ? "地址" : "Address"}</h3>
              <p>{settings.contact.address}</p>
            </article>
          </section>
        </main>
      )}

      <footer className="footer footer-rich">
        <div className="footer-grid">
          <div>
            <p className="eyebrow">{text.contact}</p>
            <h3>{lang === "zh" ? settings.branding.zhName : settings.branding.enName}</h3>
            <p>{settings.contact.description}</p>
          </div>
          <div className="footer-contact-list">
            <div>
              <strong>Email</strong>
              <span>{settings.contact.email}</span>
            </div>
            <div>
              <strong>Phone / WhatsApp</strong>
              <span>{settings.contact.phone}</span>
            </div>
            <div>
              <strong>{lang === "zh" ? "地址" : "Address"}</strong>
              <span>{settings.contact.address}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ProductGrid({ products, lang, text, onOpen }) {
  if (!products.length) {
    return <div className="empty-state">{text.noProducts}</div>;
  }

  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard key={product.id} lang={lang} product={product} detailLabel={text.detail} onOpen={onOpen} />
      ))}
    </div>
  );
}

function ProductShowcase({ products, lang, text, onOpen }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const sectionRef = useRef(null);
  const cardRefs = useRef([]);
  const productKeys = products.map((product) => product.id || product.model).join("|");
  const activeProduct = products[Math.min(activeIndex, products.length - 1)] || products[0];

  useEffect(() => {
    if (!products.length) {
      setActiveIndex(0);
      return undefined;
    }

    let observer;
    let frameId = 0;
    cardRefs.current = cardRefs.current.slice(0, products.length);

    const calculateActiveIndex = () => {
      if (window.matchMedia("(max-width: 768px)").matches) {
        return;
      }

      const cards = cardRefs.current.filter(Boolean);
      if (!cards.length) {
        return;
      }

      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const targetY = viewportHeight * 0.42;
      let nextIndex = 0;
      let closestDistance = Number.POSITIVE_INFINITY;

      cards.forEach((card, index) => {
        const rect = card.getBoundingClientRect();
        const cardCenter = rect.top + rect.height / 2;
        const distance = Math.abs(cardCenter - targetY);
        if (distance < closestDistance) {
          closestDistance = distance;
          nextIndex = index;
        }
      });

      nextIndex = Math.min(products.length - 1, Math.max(0, nextIndex));

      setActiveIndex((current) => (current === nextIndex ? current : nextIndex));
    };

    const scheduleCalculate = () => {
      if (frameId) {
        return;
      }
      frameId = window.requestAnimationFrame(() => {
        frameId = 0;
        calculateActiveIndex();
      });
    };

    setActiveIndex((current) => Math.min(current, products.length - 1));
    observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visibleEntry) {
          return;
        }

        const nextIndex = Number(visibleEntry.target.getAttribute("data-index"));
        if (!Number.isNaN(nextIndex)) {
          setActiveIndex((current) => (current === nextIndex ? current : nextIndex));
        }
      },
      {
        root: null,
        threshold: [0.35, 0.5, 0.65],
        rootMargin: "-25% 0px -35% 0px",
      },
    );

    cardRefs.current.forEach((card) => {
      if (card) {
        observer.observe(card);
      }
    });

    window.addEventListener("scroll", scheduleCalculate, { passive: true });
    window.addEventListener("resize", scheduleCalculate);
    frameId = window.requestAnimationFrame(() => {
      frameId = 0;
      calculateActiveIndex();
      window.requestAnimationFrame(calculateActiveIndex);
    });

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
      observer?.disconnect();
      window.removeEventListener("scroll", scheduleCalculate);
      window.removeEventListener("resize", scheduleCalculate);
    };
  }, [lang, products.length, productKeys]);

  if (!activeProduct) {
    return null;
  }

  return (
    <div
      className="product-showcase-section"
      ref={sectionRef}
      style={{ minHeight: products.length > 1 ? `${products.length * 80}vh` : "80vh" }}
    >
      <div className="product-showcase-layout">
        <aside className="product-sticky-image-column">
          <div className="product-sticky-image-card card">
            <div className="product-sticky-image-meta">
              <span>{String(activeIndex + 1).padStart(2, "0")}</span>
              <strong>{activeProduct.model}</strong>
            </div>
            <div className="product-sticky-image-frame">
              <img
                key={`${activeProduct.id || activeProduct.model}-${activeIndex}`}
                src={activeProduct.cover_url}
                alt={activeProduct.name}
              />
            </div>
          </div>
        </aside>

        <div className="product-scroll-info-column">
          {products.map((product, index) => (
            <article
              key={product.id || product.model}
              ref={(node) => {
                cardRefs.current[index] = node;
              }}
              data-index={index}
              data-product-id={product.id || product.model}
              className={activeIndex === index ? "product-scroll-info-card active" : "product-scroll-info-card"}
            >
              <div className="story-card-mobile-media">
                {product.cover_url ? <img src={product.cover_url} alt={product.name} /> : null}
                <div>
                  <p>{product.model}</p>
                  <strong>{getCategoryLabel(product.category, lang)}</strong>
                </div>
              </div>
              <div className="product-scroll-info-copy">
                <small>{String(index + 1).padStart(2, "0")}</small>
                <h3>{product.name}</h3>
                <div className="product-scroll-info-meta">
                  <span>{product.model}</span>
                  <span>{getCategoryLabel(product.category, lang)}</span>
                </div>
                <p>{product.short_description}</p>
                {product.features?.length ? (
                  <ul className="product-scroll-feature-list">
                    {product.features.slice(0, 4).map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
              <button className="text-btn" onClick={() => onOpen(product)}>
                {text.detail}
              </button>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProductCard({ lang, product, detailLabel, onOpen }) {
  return (
    <article className="product-card">
      <button className="product-image" onClick={() => onOpen(product)}>
        {product.cover_url ? <img src={product.cover_url} alt={product.name} /> : null}
      </button>
      <div className="product-copy">
        <p>{product.model}</p>
        <h3>{product.name}</h3>
        <span>{product.short_description}</span>
        <div className="product-card-footer">
          <div className="mini-price">
            <small>{lang === "zh" ? "分类" : "Category"}</small>
            <strong>{getCategoryLabel(product.category, lang)}</strong>
          </div>
          <button className="text-btn" onClick={() => onOpen(product)}>
            {detailLabel}
          </button>
        </div>
      </div>
    </article>
  );
}

export default App;
