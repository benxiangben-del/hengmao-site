import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import { publicUi, useSiteData } from "./siteData.js";

function normalizeSearchValue(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[\s_-]+/g, "")
    .trim();
}

const RMB_TO_USD_RATE = 7.2;

function getCategoryLabel(categoryKey, categoryMap, lang) {
  const category = categoryMap.get(categoryKey);
  return category ? category[lang] : categoryKey;
}

function parseRmbPrice(value) {
  const numeric = Number.parseFloat(String(value || "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
}

function formatDisplayPrice(value, lang) {
  const rmb = parseRmbPrice(value);
  if (lang === "zh") {
    return `RMB ${rmb.toFixed(rmb % 1 === 0 ? 0 : 2)}`;
  }

  const usd = rmb / RMB_TO_USD_RATE;
  return `USD ${usd.toFixed(usd >= 100 ? 0 : 2)}`;
}

function buildProductSearchIndex(product, categoryMap) {
  const parts = [
    product.model,
    product.id,
    product.type,
    product.name?.zh,
    product.name?.en,
    product.short?.zh,
    product.short?.en,
    product.intro?.zh,
    product.intro?.en,
    getCategoryLabel(product.type, categoryMap, "zh"),
    getCategoryLabel(product.type, categoryMap, "en"),
  ];

  if (Array.isArray(product.features?.zh)) {
    parts.push(...product.features.zh);
  }
  if (Array.isArray(product.features?.en)) {
    parts.push(...product.features.en);
  }
  if (Array.isArray(product.specs)) {
    product.specs.forEach((spec) => {
      parts.push(spec.label, spec.value);
    });
  }

  return normalizeSearchValue(parts.join(" "));
}

function App() {
  const [lang, setLang] = useState("zh");
  const [page, setPage] = useState("home");
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [storyIndex, setStoryIndex] = useState(0);
  const storyRefs = useRef([]);
  const detailVideoRef = useRef(null);
  const [pendingVideoFocus, setPendingVideoFocus] = useState(false);
  const [siteData] = useSiteData();

  const text = publicUi[lang];
  const selectedProduct =
    siteData.products.find((product) => product.id === selectedProductId) || siteData.products[0];
  const categoryMap = useMemo(
    () => new Map((siteData.productCategories || []).map((item) => [item.key, item])),
    [siteData.productCategories],
  );

  useEffect(() => {
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
    document.title = lang === "zh" ? siteData.branding.zhName : siteData.branding.enName;
  }, [lang, siteData.branding.enName, siteData.branding.zhName]);

  const categories = [
    { key: "all", label: text.all },
    ...(siteData.productCategories || []).map((item) => ({
      key: item.key,
      label: item[lang],
    })),
  ];

  const filteredProducts = useMemo(() => {
    if (category === "all") {
      return siteData.products;
    }
    return siteData.products.filter((product) => product.type === category);
  }, [category, siteData.products]);

  const storyProducts = siteData.products.slice(0, 3);

  const videoResults = useMemo(() => {
    const rawKeyword = query.trim();
    if (!rawKeyword) {
      return siteData.products;
    }

    const keyword = normalizeSearchValue(rawKeyword);
    const tokens = rawKeyword
      .split(/\s+/)
      .map((item) => normalizeSearchValue(item))
      .filter(Boolean);

    return siteData.products.filter((product) => {
      const searchIndex = buildProductSearchIndex(product, categoryMap);
      if (searchIndex.includes(keyword)) {
        return true;
      }
      return tokens.every((token) => searchIndex.includes(token));
    });
  }, [categoryMap, query, siteData.products]);

  useEffect(() => {
    if (!storyProducts.length) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }
          const nextIndex = Number(entry.target.getAttribute("data-story-index"));
          if (!Number.isNaN(nextIndex)) {
            setStoryIndex(nextIndex);
          }
        });
      },
      {
        rootMargin: "-25% 0px -45% 0px",
        threshold: 0.2,
      },
    );

    storyRefs.current.forEach((node) => {
      if (node) {
        observer.observe(node);
      }
    });

    return () => observer.disconnect();
  }, [storyProducts.length]);

  const navigate = (nextPage) => {
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openProduct = (product, options = {}) => {
    setSelectedProductId(product.id);
    setSelectedImage(0);
    setPage("detail");
    setPendingVideoFocus(Boolean(options.focusVideo));
    window.scrollTo({ top: 0, behavior: options.focusVideo ? "auto" : "smooth" });
  };

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

  const nextImage = () => {
    setSelectedImage((current) => (current + 1) % selectedProduct.images.length);
  };

  const previousImage = () => {
    setSelectedImage(
      (current) => (current - 1 + selectedProduct.images.length) % selectedProduct.images.length,
    );
  };

  return (
    <div className="site-shell">
      <header className="topbar">
        <button className="brand" onClick={() => navigate("home")}>
          <span className="brand-mark">HM</span>
          <span>
            <strong>{lang === "zh" ? siteData.branding.zhName : siteData.branding.enName}</strong>
            <small>{lang === "zh" ? siteData.branding.zhSub : siteData.branding.enSub}</small>
          </span>
        </button>

        <div className="topbar-right">
          <nav className="nav">
            <button onClick={() => navigate("home")}>{text.home}</button>
            <button onClick={() => navigate("about")}>{text.about}</button>
            <button onClick={() => navigate("products")}>{text.products}</button>
            <button onClick={() => navigate("support")}>{text.support}</button>
            <button onClick={() => navigate("contact")}>{text.contact}</button>
          </nav>

          <button className="lang-switch" onClick={() => setLang(lang === "zh" ? "en" : "zh")}>
            {text.switchLabel}
          </button>
        </div>
      </header>

      {page === "home" && (
        <main>
          <section className="hero">
            <div className="hero-copy">
              <p className="eyebrow">
                {lang === "zh" ? siteData.home.heroTag.zh : siteData.home.heroTag.en}
              </p>
              <h1>{lang === "zh" ? siteData.home.heroTitle.zh : siteData.home.heroTitle.en}</h1>
              <p className="lead">
                {lang === "zh" ? siteData.home.heroDesc.zh : siteData.home.heroDesc.en}
              </p>
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
              <img src={siteData.products[1]?.images[0] || siteData.products[0]?.images[0]} alt="" />
              <div className="hero-stats">
                <div>
                  <strong>{siteData.products.length}</strong>
                  <span>{lang === "zh" ? "产品数量" : "Products"}</span>
                </div>
                <div>
                  <strong>{siteData.productCategories?.length || 0}</strong>
                  <span>{lang === "zh" ? "产品分类" : "Categories"}</span>
                </div>
                <button className="hero-stat-button" onClick={() => navigate("support")}>
                  <strong>Help</strong>
                  <span>{lang === "zh" ? "型号搜索" : "Model Search"}</span>
                </button>
              </div>
            </div>
          </section>

          <section className="section">
            <div className="section-heading">
              <p className="eyebrow">{lang === "zh" ? siteData.about.title.zh : siteData.about.title.en}</p>
              <h2>{lang === "zh" ? siteData.branding.zhName : siteData.branding.enName}</h2>
              <p>{lang === "zh" ? siteData.about.body.zh : siteData.about.body.en}</p>
            </div>
            <div className="feature-grid">
              {siteData.home.strengths.map((item) => (
                <article key={item.zhTitle} className="card">
                  <h3>{lang === "zh" ? item.zhTitle : item.enTitle}</h3>
                  <p>{lang === "zh" ? item.zhText : item.enText}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="section section-alt">
            <div className="section-heading">
              <p className="eyebrow">{text.featured}</p>
              <h2>{text.productCenterTitle}</h2>
              <p>{text.featuredDesc}</p>
            </div>
            <div className="story-shell">
              <div className="story-stage card">
                <div className="story-stage-copy">
                  <small>{`0${storyIndex + 1}`}</small>
                  <h3>{storyProducts[storyIndex]?.name[lang]}</h3>
                  <p>{storyProducts[storyIndex]?.intro[lang]}</p>
                  <div className="story-meta">
                    <div>
                      <strong>{storyProducts[storyIndex]?.model}</strong>
                      <span>{lang === "zh" ? "产品型号" : "Model"}</span>
                    </div>
                    <div>
                      <strong>{formatDisplayPrice(storyProducts[storyIndex]?.price, lang)}</strong>
                      <span>{text.priceLabel}</span>
                    </div>
                  </div>
                </div>
                <div className="story-stage-photo">
                  <img
                    key={`${storyProducts[storyIndex]?.id}-${storyIndex}`}
                    src={storyProducts[storyIndex]?.images[0]}
                    alt={storyProducts[storyIndex]?.name[lang]}
                  />
                </div>
              </div>
              <div className="story-scroll">
                {storyProducts.map((product, index) => (
                  <article
                    key={product.id}
                    ref={(node) => {
                      storyRefs.current[index] = node;
                    }}
                    data-story-index={index}
                    className={storyIndex === index ? "story-card active" : "story-card"}
                  >
                    <div className="story-card-inner">
                      <small>{`0${index + 1}`}</small>
                      <h3>{product.name[lang]}</h3>
                      <p>{product.short[lang]}</p>
                    </div>
                    <button className="text-btn" onClick={() => openProduct(product)}>
                      {lang === "zh" ? "进入产品详情" : "Open Detail"}
                    </button>
                  </article>
                ))}
              </div>
            </div>
            <div className="product-grid">
              {siteData.products.map((product) => (
                <ProductCard
                  key={product.id}
                  lang={lang}
                  product={product}
                  detailLabel={text.detail}
                  priceLabel={text.priceLabel}
                  displayPrice={formatDisplayPrice(product.price, lang)}
                  onOpen={openProduct}
                />
              ))}
            </div>
          </section>
        </main>
      )}

      {page === "about" && (
        <main className="page">
          <div className="section-heading compact">
            <p className="eyebrow">{text.about}</p>
            <h1>{lang === "zh" ? siteData.about.title.zh : siteData.about.title.en}</h1>
          </div>
          <section className="about-layout">
            <article className="card card-large">
              <p>{lang === "zh" ? siteData.about.body.zh : siteData.about.body.en}</p>
            </article>
            <div className="stack">
              {siteData.about.points.map((point) => (
                <article key={point.zh} className="card">
                  <h3>{lang === "zh" ? point.zh : point.en}</h3>
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

          <div className="product-grid">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                lang={lang}
                product={product}
                detailLabel={text.detail}
                priceLabel={text.priceLabel}
                displayPrice={formatDisplayPrice(product.price, lang)}
                onOpen={openProduct}
              />
            ))}
          </div>
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
                <img src={selectedProduct.images[selectedImage]} alt={selectedProduct.name[lang]} />
                <button className="gallery-arrow left" onClick={previousImage}>
                  {"<"}
                </button>
                <button className="gallery-arrow right" onClick={nextImage}>
                  {">"}
                </button>
              </div>

              <div className="thumb-row">
                {selectedProduct.images.map((image, index) => (
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
              <h1>{selectedProduct.name[lang]}</h1>
              <div className="price-chip">
                <span>{text.priceLabel}</span>
                <strong>{formatDisplayPrice(selectedProduct.price, lang)}</strong>
              </div>

              <section className="detail-block">
                <h3>{text.detailIntroTitle}</h3>
                <p>{selectedProduct.intro[lang]}</p>
              </section>

              <section className="detail-block">
                <h3>{text.detailFeatureTitle}</h3>
                <ul className="feature-list">
                  {selectedProduct.features[lang].map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              </section>

              <section className="detail-block">
                <h3>{text.detailSpecTitle}</h3>
                <div className="spec-table">
                  {selectedProduct.specs.map((spec) => (
                    <div key={`${spec.label}-${spec.value}`} className="spec-row">
                      <span>{spec.label}</span>
                      <strong>{spec.value}</strong>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>

          <section ref={detailVideoRef} className="section detail-video-section">
            <div className="section-heading compact">
              <p className="eyebrow">{selectedProduct.model}</p>
              <h2>{text.detailVideoTitle}</h2>
            </div>
            <video controls className="video-player" src={selectedProduct.video}>
              {lang === "zh"
                ? "您的浏览器不支持视频播放。"
                : "Your browser does not support video playback."}
            </video>
          </section>
        </main>
      )}

      {page === "support" && (
        <main className="page">
          <div className="section-heading compact">
            <p className="eyebrow">{text.support}</p>
            <h1>{text.searchTitle}</h1>
            <p>{text.searchDesc}</p>
          </div>

          <div className="search-panel">
            <input
              className="search-input"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
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
                    <img src={product.images[0]} alt={product.name[lang]} />
                    <div className="result-copy">
                      <p>{product.model}</p>
                      <h3>{product.name[lang]}</h3>
                      <span>{product.short[lang]}</span>
                    </div>
                    <button
                      className="primary-btn"
                      onClick={(event) => {
                        event.stopPropagation();
                        openProduct(product, { focusVideo: true });
                      }}
                    >
                      {text.watchVideo}
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state">{text.searchEmpty}</div>
            )}
          </section>
        </main>
      )}

      {page === "contact" && (
        <main className="page">
          <div className="section-heading compact">
            <p className="eyebrow">{text.contact}</p>
            <h1>{text.contactTitle}</h1>
            <p>{lang === "zh" ? siteData.contact.descZh : siteData.contact.descEn}</p>
          </div>
          <section className="contact-grid">
            <article className="card">
              <h3>{lang === "zh" ? "邮箱" : "Email"}</h3>
              <p>{siteData.contact.email}</p>
            </article>
            <article className="card">
              <h3>{lang === "zh" ? "电话 / WhatsApp" : "Phone / WhatsApp"}</h3>
              <p>{siteData.contact.phone}</p>
            </article>
            <article className="card">
              <h3>{lang === "zh" ? "地址" : "Address"}</h3>
              <p>{lang === "zh" ? siteData.contact.addressZh : siteData.contact.addressEn}</p>
            </article>
          </section>
        </main>
      )}

      <footer className="footer footer-rich">
        <div className="footer-grid">
          <div>
            <p className="eyebrow">{lang === "zh" ? "联系我们" : "Contact"}</p>
            <h3>{lang === "zh" ? siteData.branding.zhName : siteData.branding.enName}</h3>
            <p>{lang === "zh" ? siteData.contact.descZh : siteData.contact.descEn}</p>
          </div>
          <div className="footer-contact-list">
            <div>
              <strong>{lang === "zh" ? "邮箱" : "Email"}</strong>
              <span>{siteData.contact.email}</span>
            </div>
            <div>
              <strong>{lang === "zh" ? "电话 / WhatsApp" : "Phone / WhatsApp"}</strong>
              <span>{siteData.contact.phone}</span>
            </div>
            <div>
              <strong>{lang === "zh" ? "地址" : "Address"}</strong>
              <span>{lang === "zh" ? siteData.contact.addressZh : siteData.contact.addressEn}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ProductCard({ lang, product, detailLabel, priceLabel, displayPrice, onOpen }) {
  return (
    <article className="product-card">
      <button className="product-image" onClick={() => onOpen(product)}>
        <img src={product.images[0]} alt={product.name[lang]} />
      </button>
      <div className="product-copy">
        <p>{product.model}</p>
        <h3>{product.name[lang]}</h3>
        <span>{product.short[lang]}</span>
        <div className="product-card-footer">
          <div className="mini-price">
            <small>{priceLabel}</small>
            <strong>{displayPrice}</strong>
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
