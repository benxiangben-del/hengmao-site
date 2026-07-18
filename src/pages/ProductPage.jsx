import { useEffect, useState } from "react";
import { localizePath, SiteLink } from "../app/router.jsx";
import EmptyState from "../components/EmptyState.jsx";
import Icon from "../components/Icon.jsx";

const guideLabels = {
  installation: { zh: "安装方法", en: "Installation" },
  usage: { zh: "使用方法", en: "Operation" },
  safety: { zh: "安全与注意事项", en: "Safety & precautions" },
  maintenance: { zh: "维护保养", en: "Maintenance" },
};

function guideLines(guide, lang) {
  if (!guide || guide.requirement === "pending") return [];
  const content = lang === "zh" ? guide.zhContent : guide.enContent;
  return String(content || "").split("\n").map((line) => line.trim()).filter(Boolean);
}

function documentHref(document) {
  return document.url || document.public_url || document.file_url || "";
}

export default function ProductPage({ lang, text, router, catalog }) {
  const product = catalog.findBySlug(router.params.slug);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  useEffect(() => setActiveMediaIndex(0), [product?.slug]);

  if (!product) {
    return (
      <main id="main-content" className="section">
        <div className="site-container">
          <EmptyState lang={lang} title={lang === "zh" ? "未找到这个产品" : "Product not found"} />
        </div>
      </main>
    );
  }

  const imageMedia = (product.media || []).filter((item) => item.kind === "image" && item.url);
  const videoMedia = (product.media || []).filter((item) => item.kind === "video" && item.url);
  const gallery = imageMedia.length ? imageMedia : product.image ? [{ id: "cover", url: product.image }] : [];
  const activeMedia = gallery[activeMediaIndex] || gallery[0];
  const videos = videoMedia.length ? videoMedia : product.video ? [{ id: "video", url: product.video }] : [];
  const hasSpecifications = product.specifications?.length > 0;
  const documents = (product.documents || []).filter((document) => documentHref(document));
  const hasDocuments = documents.length > 0;
  const isDemo = catalog.source !== "static-content" || product.status === "demo";

  return (
    <main id="main-content">
      <div className="site-container breadcrumb">
        <SiteLink to={localizePath(lang)} router={router}>{text.nav.home}</SiteLink>
        <span>/</span>
        <SiteLink to={localizePath(lang, "products")} router={router}>{text.nav.products}</SiteLink>
        <span>/</span>
        <strong>{product.name[lang]}</strong>
      </div>

      <section className="product-overview">
        <div className="site-container product-overview-grid">
          <div className="product-gallery">
            {isDemo && <span className="status-badge">{text.demo}</span>}
            {activeMedia ? (
              <img src={activeMedia.url} alt={activeMedia[lang === "zh" ? "altZh" : "altEn"] || product.name[lang]} />
            ) : (
              <EmptyState lang={lang} title={lang === "zh" ? "主图待上传" : "Cover image pending"} />
            )}
            {gallery.length > 0 && (
              <div className="thumbnail-row" aria-label={lang === "zh" ? "产品图片" : "Product images"}>
                {gallery.slice(0, 5).map((media, index) => (
                  <button key={media.id || media.url} className={`thumbnail${index === activeMediaIndex ? " is-active" : ""}`} type="button" onClick={() => setActiveMediaIndex(index)}>
                    <img src={media.url} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="product-summary">
            <p className="eyebrow">{product.category[lang]}</p>
            <h1>{product.name[lang]}</h1>
            <p className="model-line">{lang === "zh" ? "型号" : "Model"}: <strong>{product.model}</strong></p>
            <p className="lead-copy">{product.summary[lang]}</p>
            {!hasSpecifications && (
              <div className="pending-panel">
                <Icon name="book" size={22} />
                <div><strong>{lang === "zh" ? "参数等待确认" : "Specifications pending"}</strong><p>{text.notProvided}</p></div>
              </div>
            )}
            <div className="product-actions">
              {videos.length > 0 && <a className="button button--primary" href="#product-video"><Icon name="play" size={18} />{lang === "zh" ? "查看产品视频" : "View product video"}</a>}
              {hasDocuments ? (
                <a className="button button--secondary" href={documentHref(documents[0])}><Icon name="download" size={18} />{lang === "zh" ? "查看说明书" : "View manual"}</a>
              ) : (
                <button className="button button--secondary" disabled><Icon name="download" size={18} />{lang === "zh" ? "说明书待提供" : "Manual pending"}</button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="site-container product-detail-layout">
          <aside className="detail-nav">
            <strong>{lang === "zh" ? "本页内容" : "On this page"}</strong>
            <a href="#specifications">{lang === "zh" ? "技术参数" : "Specifications"}</a>
            {Object.entries(guideLabels).map(([type, label]) => <a key={type} href={`#${type}`}>{label[lang]}</a>)}
            {videos.length > 0 && <a href="#product-video">{lang === "zh" ? "产品视频" : "Product video"}</a>}
            {hasDocuments && <a href="#documents">{lang === "zh" ? "资料下载" : "Downloads"}</a>}
          </aside>

          <div className="detail-content">
            <section id="specifications" className="detail-section">
              <p className="eyebrow">SPECIFICATIONS</p>
              <h2>{lang === "zh" ? "技术参数" : "Technical specifications"}</h2>
              {hasSpecifications ? (
                <div className="specification-table">
                  {product.specifications.map((spec) => (
                    <div className="specification-row" key={spec.id || spec.key}>
                      <span>{lang === "zh" ? spec.labelZh : spec.labelEn}</span>
                      <strong>{spec.valueText || spec.valueNumber || "—"}{spec.unitCode ? ` ${spec.unitCode}` : ""}</strong>
                    </div>
                  ))}
                </div>
              ) : <EmptyState lang={lang} title={text.pending} />}
            </section>

            {Object.entries(guideLabels).map(([type, label]) => {
              const lines = guideLines(product.guides?.[type], lang);
              return (
                <section id={type} className="detail-section" key={type}>
                  <p className="eyebrow">{type.toUpperCase()}</p>
                  <h2>{label[lang]}</h2>
                  {lines.length ? (
                    <div className="step-list">
                      {lines.map((line, index) => (
                        <div className={`step-item${type === "safety" ? " step-item--safety" : ""}`} key={`${type}-${index}`}>
                          <span>{String(index + 1).padStart(2, "0")}</span>
                          <div><p>{line}</p></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={type === "safety" ? "safety-notice" : "pending-panel"}>
                      <Icon name={type === "safety" ? "shield" : "book"} size={22} />
                      <div><strong>{text.pending}</strong><p>{text.notProvided}</p></div>
                    </div>
                  )}
                </section>
              );
            })}

            {videos.length > 0 && (
              <section id="product-video" className="detail-section">
                <p className="eyebrow">VIDEO</p>
                <h2>{lang === "zh" ? "产品视频" : "Product video"}</h2>
                {videos.map((media) => <video key={media.id || media.url} className="product-video" controls preload="metadata" src={media.url}>{lang === "zh" ? "浏览器不支持视频播放。" : "Your browser does not support video playback."}</video>)}
              </section>
            )}

            {hasDocuments && (
              <section id="documents" className="detail-section">
                <p className="eyebrow">DOWNLOADS</p>
                <h2>{lang === "zh" ? "资料下载" : "Downloads"}</h2>
                <div className="document-list">
                  {documents.map((document) => {
                    const href = documentHref(document);
                    return href ? <a key={document.id} href={href} target="_blank" rel="noreferrer"><Icon name="download" size={18} /><span>{document.title || document.document_type || (lang === "zh" ? "产品资料" : "Product document")}</span></a> : null;
                  })}
                </div>
              </section>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
