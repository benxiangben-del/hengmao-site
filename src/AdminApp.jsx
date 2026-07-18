import { useEffect, useMemo, useState } from "react";
import BrandMark from "./components/BrandMark.jsx";
import Icon from "./components/Icon.jsx";
import { brand, heroProducts } from "./content/demoSite.js";
import { isSupabaseConfigured } from "./lib/supabase.js";
import { getSession, signIn, signOut } from "./lib/authApi.js";
import { fetchAdminProductRecords, saveAdminProductRecord, uploadAdminProductMedia } from "./lib/contentApiV2.js";
import "./styles/tokens.css";
import "./styles/globals.css";
import "./styles/admin.css";

const PREVIEW_STORAGE_KEY = "hengmao-admin-v2-preview";

const CATEGORIES = [
  { key: "portable-washer", zh: "便携式清洗设备", en: "Portable Washers" },
  { key: "trolley-washer", zh: "推车式清洗设备", en: "Trolley Washers" },
  { key: "spray-gun", zh: "水枪", en: "Spray Guns" },
  { key: "high-pressure-hose", zh: "高压管", en: "High-pressure Hoses" },
  { key: "steel-wire-hose", zh: "钢丝管", en: "Steel-wire Hoses" },
  { key: "accessory", zh: "其他配件", en: "Other Accessories" },
];

const NAV_ITEMS = [
  { key: "dashboard", label: "内容概览", short: "OV" },
  { key: "products", label: "双语产品", short: "PR" },
  { key: "support", label: "安装与支持", short: "SP" },
  { key: "media", label: "媒体与资料", short: "MD" },
  { key: "homepage", label: "首页推荐", short: "HM" },
  { key: "settings", label: "站点设置", short: "ST" },
];

const EDITOR_TABS = [
  { key: "identity", label: "基础信息" },
  { key: "zh-CN", label: "中文内容" },
  { key: "en", label: "English" },
  { key: "technical", label: "参数与包装" },
  { key: "guides", label: "指南与安全" },
  { key: "publishing", label: "媒体与发布" },
];

const EMPTY_TRANSLATION = {
  status: "draft",
  name: "",
  shortDescription: "",
  description: "",
  featuresText: "",
  applicationsText: "",
  seoTitle: "",
  seoDescription: "",
};

const EMPTY_GUIDE = {
  requirement: "pending",
  version: "1.0",
  technicalReviewStatus: "unverified",
  zhStatus: "draft",
  enStatus: "draft",
  zhContent: "",
  enContent: "",
};

function newProductRecord() {
  return {
    id: null,
    model: "",
    slug: "",
    categoryKey: "portable-washer",
    status: "draft",
    lifecycleStatus: "active",
    sortOrder: 0,
    translations: {
      "zh-CN": { ...EMPTY_TRANSLATION },
      en: { ...EMPTY_TRANSLATION },
    },
    specifications: [],
    packageContents: [],
    guides: {
      installation: { ...EMPTY_GUIDE },
      usage: { ...EMPTY_GUIDE, requirement: "required" },
      safety: { ...EMPTY_GUIDE, requirement: "required" },
      maintenance: { ...EMPTY_GUIDE },
    },
    media: [],
    documents: [],
    placements: { homeHero: false, homeHeroOrder: 0 },
    updatedAt: new Date().toISOString(),
  };
}

function demoProductRecord() {
  return {
    ...newProductRecord(),
    id: "demo-local-product",
    model: "型号待确认",
    slug: "demo-portable-washer",
    translations: {
      "zh-CN": {
        ...EMPTY_TRANSLATION,
        name: "便携式高压清洗设备（演示）",
        shortDescription: "用于验证新版官网产品结构与后台字段的演示记录。",
        description: "正式型号、参数、安装说明和安全内容将在资料确认后录入。",
      },
      en: {
        ...EMPTY_TRANSLATION,
        name: "Portable Pressure Washer (Demo)",
        shortDescription: "A demonstration record for validating the bilingual product workflow.",
        description: "The verified model, specifications and support content will be added after review.",
      },
    },
    media: [
      {
        assetKey: "demo-portable-cover",
        url: "/media/demo/demo-portable-washer.png",
        role: "cover",
        kind: "image",
        rightsStatus: "pending",
        altZh: "便携式高压清洗设备演示图",
        altEn: "Portable pressure washer demonstration image",
      },
    ],
    placements: { homeHero: true, homeHeroOrder: 1 },
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function categoryName(key) {
  return CATEGORIES.find((category) => category.key === key)?.zh || key;
}

function statusLabel(status) {
  return {
    draft: "草稿",
    review: "待审核",
    published: "已发布",
    archived: "已归档",
  }[status] || status;
}

function translationScore(translation) {
  const fields = ["name", "shortDescription", "description", "seoTitle", "seoDescription"];
  const completed = fields.filter((field) => String(translation?.[field] || "").trim()).length;
  return Math.round((completed / fields.length) * 100);
}

function productReadiness(product) {
  const zh = translationScore(product.translations?.["zh-CN"]);
  const en = translationScore(product.translations?.en);
  const cover = product.media?.some((item) => item.role === "cover" && item.rightsStatus === "approved") ? 100 : 0;
  const approvedSpecs = product.specifications?.some((item) => item.verificationStatus === "approved") ? 100 : 0;
  return Math.round((zh + en + cover + approvedSpecs) / 4);
}

function readPreviewProducts() {
  try {
    const stored = window.localStorage.getItem(PREVIEW_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // Browser storage is optional in preview mode.
  }
  return [demoProductRecord()];
}

function AdminApp() {
  const previewMode = !isSupabaseConfigured;
  const [session, setSession] = useState(null);
  const [login, setLogin] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [products, setProducts] = useState(() => (previewMode ? readPreviewProducts() : []));
  const [activeNav, setActiveNav] = useState("dashboard");
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(() => newProductRecord());
  const [editorTab, setEditorTab] = useState("identity");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(!previewMode);
  const [saving, setSaving] = useState(false);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const selectedProduct = products.find((product) => product.id === selectedId) || null;

  const filteredProducts = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return products.filter((product) => {
      const names = `${product.model} ${product.translations?.["zh-CN"]?.name || ""} ${product.translations?.en?.name || ""}`.toLowerCase();
      return (!keyword || names.includes(keyword)) && (statusFilter === "all" || product.status === statusFilter);
    });
  }, [products, query, statusFilter]);

  const dashboard = useMemo(() => ({
    total: products.length,
    published: products.filter((product) => product.status === "published").length,
    missingEnglish: products.filter((product) => translationScore(product.translations?.en) < 100).length,
    technicalReview: products.filter((product) => !product.specifications?.length || product.specifications.some((spec) => spec.verificationStatus !== "approved")).length,
    hero: products.filter((product) => product.placements?.homeHero).length,
  }), [products]);

  useEffect(() => {
    document.documentElement.lang = "zh-CN";
    document.title = "恒猫内容工作台｜HENGMAO CMS";
  }, []);

  useEffect(() => {
    if (previewMode) return;
    getSession()
      .then((nextSession) => setSession(nextSession))
      .catch((sessionError) => setError(sessionError.message))
      .finally(() => setLoading(false));
  }, [previewMode]);

  useEffect(() => {
    if (!session || previewMode) return;
    setLoading(true);
    fetchAdminProductRecords()
      .then((records) => setProducts(records))
      .catch((loadError) => setError(`v2 内容库尚未就绪：${loadError.message}`))
      .finally(() => setLoading(false));
  }, [session, previewMode]);

  function showNotice(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3200);
  }

  async function handleLogin() {
    try {
      setLoginError("");
      const { session: nextSession } = await signIn(login.email, login.password);
      setSession(nextSession);
    } catch (signInError) {
      setLoginError(signInError.message || "登录失败，请检查账号和密码。");
    }
  }

  async function handleLogout() {
    await signOut();
    setSession(null);
    setProducts([]);
  }

  function openProduct(product) {
    setSelectedId(product.id);
    setForm(clone(product));
    setEditorTab("identity");
    setActiveNav("products");
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startProduct() {
    setSelectedId(null);
    setForm(newProductRecord());
    setEditorTab("identity");
    setActiveNav("products");
    setSidebarOpen(false);
  }

  function updateRoot(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateTranslation(locale, field, value) {
    setForm((current) => ({
      ...current,
      translations: {
        ...current.translations,
        [locale]: { ...current.translations[locale], [field]: value },
      },
    }));
  }

  function updateGuide(type, field, value) {
    setForm((current) => ({
      ...current,
      guides: { ...current.guides, [type]: { ...current.guides[type], [field]: value } },
    }));
  }

  function updatePlacement(field, value) {
    setForm((current) => ({
      ...current,
      placements: { ...current.placements, [field]: value },
    }));
  }

  function updateList(listKey, index, field, value) {
    setForm((current) => ({
      ...current,
      [listKey]: current[listKey].map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item),
    }));
  }

  function addSpecification() {
    setForm((current) => ({
      ...current,
      specifications: [...current.specifications, {
        key: "",
        groupKey: "performance",
        labelZh: "",
        labelEn: "",
        valueText: "",
        unitCode: "",
        sourceReference: "",
        verificationStatus: "unverified",
      }],
    }));
  }

  function addPackageItem() {
    setForm((current) => ({
      ...current,
      packageContents: [...current.packageContents, {
        key: "",
        quantity: 1,
        unitCode: "pc",
        nameZh: "",
        nameEn: "",
      }],
    }));
  }

  function removeListItem(listKey, index) {
    setForm((current) => ({
      ...current,
      [listKey]: current[listKey].filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  function validateProduct(record) {
    if (!record.model.trim() || !record.slug.trim()) return "型号和 URL slug 不能为空。";
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.slug)) return "URL slug 只能使用小写字母、数字和连字符。";
    if (!record.translations["zh-CN"].name.trim()) return "中文产品名称不能为空。";
    if (record.media.filter((item) => item.role === "cover").length > 1) return "每款产品只能设置一张主图，请把其他图片改为图库或详情图。";
    if (record.status === "published") {
      if (translationScore(record.translations["zh-CN"]) < 100 || translationScore(record.translations.en) < 100) return "正式发布前必须完成中英文名称、摘要、介绍和 SEO。";
      if (record.translations["zh-CN"].status !== "published" || record.translations.en.status !== "published") return "正式发布前，中英文内容都必须单独设为已发布。";
      if (!record.media.some((item) => item.role === "cover" && item.rightsStatus === "approved")) return "正式发布前必须有权属已确认的产品主图。";
      if (!record.specifications.length || record.specifications.some((item) => item.verificationStatus !== "approved" || !String(item.sourceReference || "").trim())) return "正式发布前，技术参数必须全部审核通过并填写资料来源。";
      if (record.guides.safety.technicalReviewStatus !== "approved") return "正式发布前，安全与注意事项必须通过技术审核。";
    }
    return "";
  }

  async function saveProduct() {
    const validationError = validateProduct(form);
    if (validationError) {
      setError(validationError);
      return;
    }
    try {
      setSaving(true);
      setError("");
      const record = { ...clone(form), id: form.id || `preview-${Date.now()}`, updatedAt: new Date().toISOString() };
      if (previewMode) {
        const next = selectedId
          ? products.map((product) => product.id === selectedId ? record : product)
          : [...products, record];
        setProducts(next);
        setSelectedId(record.id);
        setForm(record);
        try { window.localStorage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(next)); } catch { /* optional */ }
        showNotice("已保存到本机结构预览；尚未写入 Supabase。");
      } else {
        const saved = await saveAdminProductRecord(record);
        const next = products.some((product) => product.id === saved.id)
          ? products.map((product) => product.id === saved.id ? saved : product)
          : [...products, saved];
        setProducts(next);
        setSelectedId(saved.id);
        setForm(saved);
        showNotice("产品已保存到 Supabase v2 内容库。");
      }
    } catch (saveError) {
      setError(saveError.message || "保存失败。");
    } finally {
      setSaving(false);
    }
  }

  async function uploadMedia(file, role) {
    if (previewMode) {
      setError("当前是结构预览，素材不会上传。正式连接 Supabase 后可在这里上传图片和视频。");
      return;
    }
    if (!form.id) {
      setError("请先保存产品基础信息，再上传素材。");
      return;
    }
    try {
      setMediaUploading(true);
      setError("");
      const saved = await uploadAdminProductMedia(form.id, file, role);
      setProducts((current) => current.map((product) => product.id === saved.id ? saved : product));
      setForm(saved);
      showNotice("素材已上传；请补充中英文替代文字并确认权属状态。");
    } catch (uploadError) {
      setError(uploadError.message || "素材上传失败。");
    } finally {
      setMediaUploading(false);
    }
  }

  if (!previewMode && loading && !session) {
    return <div className="hm-admin-loading"><span>HM</span><p>正在连接内容工作台…</p></div>;
  }

  if (!previewMode && !session) {
    return (
      <main className="hm-admin-login">
        <section className="hm-admin-login-card">
          <BrandMark brand={brand} />
          <p className="hm-admin-kicker">SECURE CONTENT WORKSPACE</p>
          <h1>登录恒猫内容工作台</h1>
          <p>使用 Supabase Auth 管理员账号登录。产品内容、媒体和发布状态将写入同一套 v2 内容库。</p>
          <Field label="邮箱" value={login.email} onChange={(value) => setLogin((current) => ({ ...current, email: value }))} />
          <Field label="密码" type="password" value={login.password} onChange={(value) => setLogin((current) => ({ ...current, password: value }))} onEnter={handleLogin} />
          {loginError ? <div className="hm-admin-alert is-error">{loginError}</div> : null}
          <button className="hm-admin-button is-primary is-wide" type="button" onClick={handleLogin}>登录后台</button>
          <a className="hm-admin-text-link" href="/zh/">返回官网</a>
        </section>
      </main>
    );
  }

  return (
    <div className="hm-admin-shell">
      <aside className={`hm-admin-sidebar${sidebarOpen ? " is-open" : ""}`}>
        <div className="hm-admin-brand"><BrandMark brand={brand} inverse /></div>
        <p className="hm-admin-sidebar-label">CONTENT WORKSPACE</p>
        <nav aria-label="后台主导航">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              className={activeNav === item.key ? "is-active" : ""}
              type="button"
              onClick={() => { setActiveNav(item.key); setSidebarOpen(false); }}
            >
              <span>{item.short}</span>{item.label}
            </button>
          ))}
        </nav>
        <div className="hm-admin-sidebar-meta">
          <span className={`hm-admin-connection${previewMode ? " is-preview" : ""}`}><i />{previewMode ? "结构预览模式" : "Supabase 已连接"}</span>
          <small>内容模型 v1.0</small>
        </div>
      </aside>

      <div className="hm-admin-workspace">
        <header className="hm-admin-topbar">
          <button className="hm-admin-menu" type="button" onClick={() => setSidebarOpen((open) => !open)} aria-label="打开后台导航"><Icon name="menu" /></button>
          <div>
            <p>{NAV_ITEMS.find((item) => item.key === activeNav)?.label}</p>
            <h1>{activeNav === "products" && selectedId ? "编辑双语产品" : "恒猫内容工作台"}</h1>
          </div>
          <div className="hm-admin-top-actions">
            <span className={`hm-admin-mode-pill${previewMode ? " is-preview" : ""}`}>{previewMode ? "未连接数据库" : "LIVE DATA"}</span>
            <a className="hm-admin-button is-secondary" href="/zh/" target="_blank" rel="noreferrer">查看官网</a>
            {!previewMode ? <button className="hm-admin-button is-secondary" type="button" onClick={handleLogout}>退出</button> : null}
          </div>
        </header>

        {previewMode ? (
          <div className="hm-admin-banner">
            <Icon name="shield" size={21} />
            <div><strong>当前是结构预览，不是服务器后台</strong><p>您可以体验字段与工作流，保存内容只保留在本机浏览器；配置并迁移 Supabase 后才会成为正式后台。</p></div>
          </div>
        ) : null}
        {notice ? <div className="hm-admin-toast is-success">{notice}</div> : null}
        {error ? <div className="hm-admin-toast is-error"><span>{error}</span><button type="button" onClick={() => setError("")}>关闭</button></div> : null}
        {loading ? <div className="hm-admin-progress">正在同步 v2 内容库…</div> : null}

        <main className="hm-admin-main">
          {activeNav === "dashboard" ? <Dashboard dashboard={dashboard} products={products} onNew={startProduct} onOpen={openProduct} /> : null}
          {activeNav === "products" ? (
            <ProductsWorkspace
              products={filteredProducts}
              allCount={products.length}
              query={query}
              statusFilter={statusFilter}
              selectedId={selectedId}
              form={form}
              editorTab={editorTab}
              saving={saving}
              previewMode={previewMode}
              mediaUploading={mediaUploading}
              onQuery={setQuery}
              onStatus={setStatusFilter}
              onOpen={openProduct}
              onNew={startProduct}
              onTab={setEditorTab}
              onRoot={updateRoot}
              onTranslation={updateTranslation}
              onGuide={updateGuide}
              onPlacement={updatePlacement}
              onList={updateList}
              onAddSpec={addSpecification}
              onAddPackage={addPackageItem}
              onRemoveList={removeListItem}
              onSave={saveProduct}
              onMediaUpload={uploadMedia}
            />
          ) : null}
          {activeNav === "support" ? <SupportOverview products={products} onOpen={openProduct} /> : null}
          {activeNav === "media" ? <MediaOverview products={products} onOpen={openProduct} /> : null}
          {activeNav === "homepage" ? <HomepagePlacements products={products} onOpen={openProduct} /> : null}
          {activeNav === "settings" ? <SettingsOverview previewMode={previewMode} /> : null}
        </main>
      </div>
    </div>
  );
}

function Dashboard({ dashboard, products, onNew, onOpen }) {
  return (
    <div className="hm-admin-stack">
      <section className="hm-admin-intro">
        <div><p className="hm-admin-kicker">CONTENT OPERATIONS</p><h2>产品资料是否完整，一目了然</h2><p>围绕中英文、技术审核、媒体权属和首页推荐管理内容，而不是只维护一张产品表。</p></div>
        <button className="hm-admin-button is-primary" type="button" onClick={onNew}>新增双语产品</button>
      </section>
      <div className="hm-admin-stats">
        <Metric label="产品记录" value={dashboard.total} note="包含草稿与演示" />
        <Metric label="正式发布" value={dashboard.published} note="前台可公开读取" />
        <Metric label="英文待完善" value={dashboard.missingEnglish} note="不使用中文自动替代" />
        <Metric label="技术待审核" value={dashboard.technicalReview} note="参数与安全内容" />
        <Metric label="首页推荐" value={dashboard.hero} note="最多启用 4 款" />
      </div>
      <section className="hm-admin-panel">
        <PanelHeading eyebrow="RECENT PRODUCTS" title="最近产品记录" description="从这里继续完善双语内容和发布条件。" />
        <div className="hm-admin-record-list">
          {products.map((product) => (
            <button key={product.id} type="button" onClick={() => onOpen(product)}>
              <ProductThumb product={product} />
              <span><strong>{product.translations["zh-CN"].name || "未命名产品"}</strong><small>{product.model} · {categoryName(product.categoryKey)}</small></span>
              <Readiness value={productReadiness(product)} />
              <em className={`hm-admin-status is-${product.status}`}>{statusLabel(product.status)}</em>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function ProductsWorkspace(props) {
  const {
    products, allCount, query, statusFilter, selectedId, form, editorTab, saving, previewMode, mediaUploading,
    onQuery, onStatus, onOpen, onNew, onTab, onRoot, onTranslation, onGuide,
    onPlacement, onList, onAddSpec, onAddPackage, onRemoveList, onSave, onMediaUpload,
  } = props;
  return (
    <div className="hm-admin-products-layout">
      <section className="hm-admin-panel hm-admin-product-index">
        <PanelHeading eyebrow="PRODUCT LIBRARY" title="产品记录" description={`${products.length} / ${allCount} 条`} action={<button className="hm-admin-button is-primary is-small" type="button" onClick={onNew}>新增</button>} />
        <div className="hm-admin-filters">
          <label><Icon name="search" size={18} /><input value={query} onChange={(event) => onQuery(event.target.value)} placeholder="搜索中文、英文或型号" /></label>
          <select value={statusFilter} onChange={(event) => onStatus(event.target.value)}>
            <option value="all">全部状态</option>
            <option value="draft">草稿</option>
            <option value="review">待审核</option>
            <option value="published">已发布</option>
            <option value="archived">已归档</option>
          </select>
        </div>
        <div className="hm-admin-product-list">
          {products.map((product) => (
            <button key={product.id} className={selectedId === product.id ? "is-active" : ""} type="button" onClick={() => onOpen(product)}>
              <ProductThumb product={product} />
              <span><strong>{product.translations["zh-CN"].name || "未命名产品"}</strong><small>{product.model}</small></span>
              <em className={`hm-admin-status is-${product.status}`}>{statusLabel(product.status)}</em>
            </button>
          ))}
          {!products.length ? <div className="hm-admin-empty">没有符合筛选条件的产品。</div> : null}
        </div>
      </section>

      <section className="hm-admin-panel hm-admin-editor">
        <div className="hm-admin-editor-head">
          <div><p className="hm-admin-kicker">BILINGUAL PRODUCT RECORD</p><h2>{selectedId ? form.translations["zh-CN"].name || "编辑产品" : "新增产品"}</h2><p>{selectedId ? `${form.model} · 完整度 ${productReadiness(form)}%` : "先保存产品身份，再补充媒体和指南。"}</p></div>
          <button className="hm-admin-button is-primary" type="button" onClick={onSave} disabled={saving}>{saving ? "保存中…" : "保存产品"}</button>
        </div>
        <div className="hm-admin-editor-tabs" role="tablist">
          {EDITOR_TABS.map((tab) => <button key={tab.key} className={editorTab === tab.key ? "is-active" : ""} type="button" onClick={() => onTab(tab.key)}>{tab.label}</button>)}
        </div>

        {editorTab === "identity" ? <IdentityEditor form={form} onChange={onRoot} /> : null}
        {editorTab === "zh-CN" ? <TranslationEditor locale="zh-CN" data={form.translations["zh-CN"]} onChange={onTranslation} /> : null}
        {editorTab === "en" ? <TranslationEditor locale="en" data={form.translations.en} onChange={onTranslation} /> : null}
        {editorTab === "technical" ? <TechnicalEditor form={form} onList={onList} onAddSpec={onAddSpec} onAddPackage={onAddPackage} onRemove={onRemoveList} /> : null}
        {editorTab === "guides" ? <GuidesEditor guides={form.guides} onChange={onGuide} /> : null}
        {editorTab === "publishing" ? <PublishingEditor form={form} onRoot={onRoot} onPlacement={onPlacement} onList={onList} onMediaUpload={onMediaUpload} previewMode={previewMode} mediaUploading={mediaUploading} /> : null}
      </section>
    </div>
  );
}

function IdentityEditor({ form, onChange }) {
  return (
    <div className="hm-admin-editor-body">
      <SectionTitle index="01" title="产品身份" description="型号、URL 和分类是中英文共享的稳定数据。" />
      <div className="hm-admin-form-grid is-two">
        <Field label="正式型号" value={form.model} onChange={(value) => onChange("model", value)} helper="以铭牌或正式产品资料为准" />
        <Field label="URL slug" value={form.slug} onChange={(value) => onChange("slug", value)} helper="例如 hm-p1200，发布后保持稳定" />
        <SelectField label="产品分类" value={form.categoryKey} onChange={(value) => onChange("categoryKey", value)} options={CATEGORIES.map((item) => ({ value: item.key, label: `${item.zh} / ${item.en}` }))} />
        <SelectField label="生命周期" value={form.lifecycleStatus} onChange={(value) => onChange("lifecycleStatus", value)} options={[{ value: "active", label: "在售 Active" }, { value: "upcoming", label: "即将上市 Upcoming" }, { value: "discontinued", label: "停产 Discontinued" }]} />
        <Field label="产品中心排序" type="number" value={form.sortOrder} onChange={(value) => onChange("sortOrder", Number(value) || 0)} />
      </div>
      <div className="hm-admin-callout"><Icon name="shield" size={22} /><div><strong>不要把不同外观图片当成同一型号</strong><p>只有型号和技术资料确认后，素材才能归入正式产品记录。</p></div></div>
    </div>
  );
}

function TranslationEditor({ locale, data, onChange }) {
  const chinese = locale === "zh-CN";
  return (
    <div className="hm-admin-editor-body">
      <SectionTitle index={chinese ? "02" : "03"} title={chinese ? "中文产品内容" : "English product content"} description={chinese ? "中文和英文分别审核，未发布的英文不使用中文自动替代。" : "English content is reviewed and published independently from Chinese."} />
      <div className="hm-admin-language-score"><span>{chinese ? "中文完整度" : "English completeness"}</span><Readiness value={translationScore(data)} /></div>
      <div className="hm-admin-form-grid is-two">
        <Field label={chinese ? "正式中文名称" : "Official English name"} value={data.name} onChange={(value) => onChange(locale, "name", value)} />
        <SelectField label={chinese ? "中文发布状态" : "English status"} value={data.status} onChange={(value) => onChange(locale, "status", value)} options={[{ value: "draft", label: chinese ? "草稿" : "Draft" }, { value: "review", label: chinese ? "待审核" : "In review" }, { value: "published", label: chinese ? "已发布" : "Published" }]} />
      </div>
      <TextArea label={chinese ? "首屏摘要" : "Short description"} value={data.shortDescription} onChange={(value) => onChange(locale, "shortDescription", value)} helper={chinese ? "用于产品卡片和详情页首屏" : "Used on cards and the product hero"} />
      <TextArea label={chinese ? "完整介绍" : "Full description"} value={data.description} onChange={(value) => onChange(locale, "description", value)} rows={7} />
      <div className="hm-admin-form-grid is-two">
        <TextArea label={chinese ? "产品特点" : "Features"} value={data.featuresText} onChange={(value) => onChange(locale, "featuresText", value)} helper={chinese ? "每行一项，与英文顺序和 key 对应" : "One item per line, matching the Chinese keys"} />
        <TextArea label={chinese ? "适用场景" : "Applications"} value={data.applicationsText} onChange={(value) => onChange(locale, "applicationsText", value)} helper={chinese ? "只描述已确认用途" : "Only include verified applications"} />
        <Field label={chinese ? "SEO 标题" : "SEO title"} value={data.seoTitle} onChange={(value) => onChange(locale, "seoTitle", value)} />
        <TextArea label={chinese ? "SEO 描述" : "SEO description"} value={data.seoDescription} onChange={(value) => onChange(locale, "seoDescription", value)} />
      </div>
    </div>
  );
}

function TechnicalEditor({ form, onList, onAddSpec, onAddPackage, onRemove }) {
  return (
    <div className="hm-admin-editor-body">
      <SectionTitle index="04" title="参数与包装" description="参数值和包装数量中英文共用，标签分别维护。" />
      <div className="hm-admin-subsection-head"><div><h3>技术参数</h3><p>未审核参数不会进入正式前台。</p></div><button className="hm-admin-button is-secondary is-small" type="button" onClick={onAddSpec}>添加参数</button></div>
      <div className="hm-admin-repeat-list">
        {form.specifications.map((spec, index) => (
          <article key={`${spec.key}-${index}`}>
            <div className="hm-admin-form-grid is-three">
              <Field label="参数 key" value={spec.key} onChange={(value) => onList("specifications", index, "key", value)} />
              <Field label="中文标签" value={spec.labelZh} onChange={(value) => onList("specifications", index, "labelZh", value)} />
              <Field label="English label" value={spec.labelEn} onChange={(value) => onList("specifications", index, "labelEn", value)} />
              <Field label="参数值" value={spec.valueText} onChange={(value) => onList("specifications", index, "valueText", value)} />
              <Field label="单位" value={spec.unitCode} onChange={(value) => onList("specifications", index, "unitCode", value)} />
              <SelectField label="审核状态" value={spec.verificationStatus} onChange={(value) => onList("specifications", index, "verificationStatus", value)} options={[{ value: "unverified", label: "未验证" }, { value: "review", label: "审核中" }, { value: "approved", label: "已批准" }, { value: "rejected", label: "已拒绝" }]} />
            </div>
            <Field label="资料来源" value={spec.sourceReference} onChange={(value) => onList("specifications", index, "sourceReference", value)} helper="说明书、铭牌、检测报告或技术确认" />
            <button className="hm-admin-danger-link" type="button" onClick={() => onRemove("specifications", index)}>移除此参数</button>
          </article>
        ))}
        {!form.specifications.length ? <div className="hm-admin-empty">尚未录入技术参数。正式发布前至少确认关键参数。</div> : null}
      </div>
      <div className="hm-admin-subsection-head"><div><h3>包装清单</h3><p>数量只保存一次，中英文不会出现数量冲突。</p></div><button className="hm-admin-button is-secondary is-small" type="button" onClick={onAddPackage}>添加项目</button></div>
      <div className="hm-admin-repeat-list">
        {form.packageContents.map((item, index) => (
          <article key={`${item.key}-${index}`}>
            <div className="hm-admin-form-grid is-three">
              <Field label="项目 key" value={item.key} onChange={(value) => onList("packageContents", index, "key", value)} />
              <Field label="数量" type="number" value={item.quantity} onChange={(value) => onList("packageContents", index, "quantity", Number(value) || 1)} />
              <Field label="单位" value={item.unitCode} onChange={(value) => onList("packageContents", index, "unitCode", value)} />
              <Field label="中文名称" value={item.nameZh} onChange={(value) => onList("packageContents", index, "nameZh", value)} />
              <Field label="English name" value={item.nameEn} onChange={(value) => onList("packageContents", index, "nameEn", value)} />
            </div>
            <button className="hm-admin-danger-link" type="button" onClick={() => onRemove("packageContents", index)}>移除此项目</button>
          </article>
        ))}
      </div>
    </div>
  );
}

function GuidesEditor({ guides, onChange }) {
  const guideTypes = [
    { key: "installation", zh: "安装方法", en: "Installation" },
    { key: "usage", zh: "使用方法", en: "Usage" },
    { key: "safety", zh: "安全事项", en: "Safety" },
    { key: "maintenance", zh: "维护保养", en: "Maintenance" },
  ];
  return (
    <div className="hm-admin-editor-body">
      <SectionTitle index="05" title="安装、使用与安全" description="与产品型号绑定，并独立记录中文、英文和技术审核状态。" />
      <div className="hm-admin-guide-grid">
        {guideTypes.map((type) => {
          const guide = guides[type.key];
          return (
            <article key={type.key}>
              <div className="hm-admin-guide-title"><span>{type.key.slice(0, 2).toUpperCase()}</span><div><h3>{type.zh}</h3><p>{type.en}</p></div></div>
              <div className="hm-admin-form-grid is-two">
                <SelectField label="内容要求" value={guide.requirement} onChange={(value) => onChange(type.key, "requirement", value)} options={[{ value: "pending", label: "待确认" }, { value: "required", label: "必须提供" }, { value: "not-required", label: "明确无需" }]} />
                <SelectField label="技术审核" value={guide.technicalReviewStatus} onChange={(value) => onChange(type.key, "technicalReviewStatus", value)} options={[{ value: "unverified", label: "未验证" }, { value: "review", label: "审核中" }, { value: "approved", label: "已批准" }, { value: "changes_requested", label: "需修改" }]} />
              </div>
              <TextArea label="中文步骤/注意事项" value={guide.zhContent} onChange={(value) => onChange(type.key, "zhContent", value)} helper="每行一个经过确认的步骤或提示" />
              <TextArea label="English steps / notes" value={guide.enContent} onChange={(value) => onChange(type.key, "enContent", value)} helper="Reviewed English content only" />
            </article>
          );
        })}
      </div>
    </div>
  );
}

function PublishingEditor({ form, onRoot, onPlacement, onList, onMediaUpload, previewMode, mediaUploading }) {
  const checks = [
    { label: "中文基本内容", ok: translationScore(form.translations["zh-CN"]) === 100 },
    { label: "英文基本内容", ok: translationScore(form.translations.en) === 100 },
    { label: "主图权属确认", ok: form.media.some((item) => item.role === "cover" && item.rightsStatus === "approved") },
    { label: "技术参数审核", ok: form.specifications.length > 0 && form.specifications.every((item) => item.verificationStatus === "approved") },
    { label: "安全内容审核", ok: form.guides.safety.technicalReviewStatus === "approved" },
  ];
  return (
    <div className="hm-admin-editor-body">
      <SectionTitle index="06" title="媒体、推荐与发布" description="只有通过发布门槛的内容才能进入正式网站。" />
      <div className="hm-admin-publishing-grid">
        <section>
          <h3>产品媒体</h3>
          <p className="hm-admin-field-note">先保存产品，再上传图片或视频。新素材默认为“权属待确认”，不会直接通过发布检查。</p>
          <div className="hm-admin-upload-actions">
            {[{ role: "cover", label: "上传主图", accept: "image/*" }, { role: "gallery", label: "上传产品图片", accept: "image/*" }, { role: "video-demo", label: "上传产品视频", accept: "video/*" }].map((option) => (
              <label className={`hm-admin-button is-secondary is-small${mediaUploading ? " is-disabled" : ""}`} key={option.role}>
                {mediaUploading ? "上传中…" : option.label}
                <input
                  type="file"
                  accept={option.accept}
                  disabled={mediaUploading}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) onMediaUpload(file, option.role);
                    event.target.value = "";
                  }}
                />
              </label>
            ))}
          </div>
          {previewMode ? <p className="hm-admin-preview-hint">结构预览模式下按钮仅演示操作入口，不会上传文件。</p> : null}
          <div className="hm-admin-media-preview-grid">
            {form.media.map((media, index) => (
              <article key={media.assetKey} className="hm-admin-media-card">
                {media.kind === "video" ? <div className="hm-admin-video-thumb"><Icon name="play" size={24} /><span>VIDEO</span></div> : <img src={media.url} alt={media.altZh || ""} />}
                <div><strong>{media.role}</strong><span className={`hm-admin-rights is-${media.rightsStatus}`}>{media.rightsStatus}</span></div>
                <label>用途<select value={media.role} onChange={(event) => onList("media", index, "role", event.target.value)}><option value="cover">主图 Cover</option><option value="gallery">图库 Gallery</option><option value="detail">详情 Detail</option><option value="application">应用场景</option><option value="package">包装</option><option value="video-demo">产品视频</option><option value="video-installation">安装视频</option><option value="video-usage">使用视频</option><option value="video-maintenance">维护视频</option></select></label>
                <label>权属<select value={media.rightsStatus} onChange={(event) => onList("media", index, "rightsStatus", event.target.value)}><option value="pending">待确认 Pending</option><option value="approved">已批准 Approved</option><option value="restricted">受限 Restricted</option><option value="rejected">拒绝 Rejected</option></select></label>
                <label>中文替代文字<input value={media.altZh || ""} onChange={(event) => onList("media", index, "altZh", event.target.value)} /></label>
                <label>English alt text<input value={media.altEn || ""} onChange={(event) => onList("media", index, "altEn", event.target.value)} /></label>
              </article>
            ))}
            {!form.media.length ? <div className="hm-admin-empty">保存产品后上传主图、详情图和视频。</div> : null}
          </div>
        </section>
        <section>
          <h3>发布检查</h3>
          <div className="hm-admin-checklist">{checks.map((check) => <div key={check.label} className={check.ok ? "is-ok" : ""}><span>{check.ok ? "✓" : "!"}</span>{check.label}<em>{check.ok ? "已完成" : "待完善"}</em></div>)}</div>
          <SelectField label="产品发布状态" value={form.status} onChange={(value) => onRoot("status", value)} options={[{ value: "draft", label: "草稿" }, { value: "review", label: "提交审核" }, { value: "published", label: "正式发布" }, { value: "archived", label: "归档" }]} />
          <label className="hm-admin-toggle"><input type="checkbox" checked={form.placements.homeHero} onChange={(event) => onPlacement("homeHero", event.target.checked)} /><span /><div><strong>进入首页机器轮播</strong><small>正式环境最多启用 4 款已发布产品</small></div></label>
          {form.placements.homeHero ? <Field label="轮播顺序" type="number" value={form.placements.homeHeroOrder} onChange={(value) => onPlacement("homeHeroOrder", Number(value) || 0)} /> : null}
        </section>
      </div>
    </div>
  );
}

function SupportOverview({ products, onOpen }) {
  return (
    <div className="hm-admin-stack">
      <section className="hm-admin-intro"><div><p className="hm-admin-kicker">PRODUCT SUPPORT</p><h2>按型号管理安装、使用和安全资料</h2><p>每项指南都拥有中英文内容、技术审核状态和适用产品，避免客户查看错误教程。</p></div></section>
      <section className="hm-admin-panel">
        <PanelHeading eyebrow="GUIDE COVERAGE" title="产品支持覆盖" description="点击产品继续编辑对应指南。" />
        <div className="hm-admin-coverage-table">
          <div className="is-head"><span>产品</span><span>安装</span><span>使用</span><span>安全</span><span>维护</span></div>
          {products.map((product) => <button key={product.id} type="button" onClick={() => onOpen(product)}><span><strong>{product.translations["zh-CN"].name}</strong><small>{product.model}</small></span>{["installation", "usage", "safety", "maintenance"].map((key) => <em key={key} className={product.guides[key].technicalReviewStatus === "approved" ? "is-ok" : ""}>{product.guides[key].technicalReviewStatus === "approved" ? "已审核" : "待完善"}</em>)}</button>)}
        </div>
      </section>
    </div>
  );
}

function MediaOverview({ products, onOpen }) {
  const media = products.flatMap((product) => product.media.map((item) => ({ ...item, product })));
  return (
    <div className="hm-admin-stack">
      <section className="hm-admin-intro"><div><p className="hm-admin-kicker">MEDIA GOVERNANCE</p><h2>素材不仅要上传，还要确认归属与权利</h2><p>图片、视频和说明书都关联具体型号、用途、语言和授权状态。</p></div></section>
      <section className="hm-admin-panel">
        <PanelHeading eyebrow="MEDIA ASSETS" title="当前产品媒体" description={`${media.length} 项素材`} />
        <div className="hm-admin-asset-grid">{media.map((item) => <button key={`${item.product.id}-${item.assetKey}`} type="button" onClick={() => onOpen(item.product)}><img src={item.url} alt={item.altZh || ""} /><span><strong>{item.product.translations["zh-CN"].name}</strong><small>{item.role} · {item.assetKey}</small><em className={`hm-admin-rights is-${item.rightsStatus}`}>{item.rightsStatus}</em></span></button>)}</div>
        {!media.length ? <div className="hm-admin-empty">暂无媒体记录。</div> : null}
      </section>
    </div>
  );
}

function HomepagePlacements({ products, onOpen }) {
  return (
    <div className="hm-admin-stack">
      <section className="hm-admin-intro"><div><p className="hm-admin-kicker">HOME MERCHANDISING</p><h2>首页轮播只引用正式产品</h2><p>下面四张图片仍是当前视觉演示素材；型号确认后，再把它们关联到真实产品和推荐顺序。</p></div></section>
      <section className="hm-admin-panel">
        <PanelHeading eyebrow="CURRENT VISUAL DEMO" title="当前首页四款演示素材" description="不会自动创建四个正式产品" />
        <div className="hm-admin-hero-assets">{heroProducts.map((item, index) => <article key={item.id}><span>{String(index + 1).padStart(2, "0")}</span><img src={item.image} alt={item.name.zh} /><div><strong>{item.name.zh}</strong><small>{item.model.zh}</small></div></article>)}</div>
      </section>
      <section className="hm-admin-panel">
        <PanelHeading eyebrow="PRODUCT PLACEMENTS" title="产品推荐位" description="仅已发布产品可进入正式轮播。" />
        <div className="hm-admin-record-list">{products.filter((product) => product.placements.homeHero).map((product) => <button key={product.id} type="button" onClick={() => onOpen(product)}><ProductThumb product={product} /><span><strong>{product.translations["zh-CN"].name}</strong><small>轮播顺序 {product.placements.homeHeroOrder}</small></span><em className={`hm-admin-status is-${product.status}`}>{statusLabel(product.status)}</em></button>)}</div>
      </section>
    </div>
  );
}

function SettingsOverview({ previewMode }) {
  return (
    <div className="hm-admin-stack">
      <section className="hm-admin-intro"><div><p className="hm-admin-kicker">SITE SETTINGS</p><h2>品牌与站点配置</h2><p>产品数据与站点固定信息分开管理，避免修改产品时影响品牌结构。</p></div></section>
      <div className="hm-admin-settings-grid">
        <section className="hm-admin-panel"><PanelHeading eyebrow="BRAND" title="品牌基线" /><Field label="中文名称" value="上海恒猫机电" readOnly /><Field label="English name" value="Shanghai Hengmao Machinery" readOnly /><Field label="品牌口号" value="可靠设备，清洁更高效" readOnly /></section>
        <section className="hm-admin-panel"><PanelHeading eyebrow="DATA SOURCE" title="内容数据源" /><div className="hm-admin-data-status"><span className={previewMode ? "is-preview" : "is-live"}>{previewMode ? "结构预览" : "Supabase v2"}</span><p>{previewMode ? "尚未设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY。" : "后台与前台使用同一套 content_v2 内容结构。"}</p></div></section>
      </div>
    </div>
  );
}

function Metric({ label, value, note }) {
  return <article><span>{label}</span><strong>{String(value).padStart(2, "0")}</strong><small>{note}</small></article>;
}

function PanelHeading({ eyebrow, title, description, action }) {
  return <div className="hm-admin-panel-heading"><div><p>{eyebrow}</p><h2>{title}</h2>{description ? <span>{description}</span> : null}</div>{action}</div>;
}

function SectionTitle({ index, title, description }) {
  return <div className="hm-admin-section-title"><span>{index}</span><div><h3>{title}</h3><p>{description}</p></div></div>;
}

function ProductThumb({ product }) {
  const cover = product.media?.find((item) => item.role === "cover");
  return cover ? <img className="hm-admin-product-thumb" src={cover.url} alt="" /> : <span className="hm-admin-product-thumb is-empty">HM</span>;
}

function Readiness({ value }) {
  return <span className="hm-admin-readiness" aria-label={`完整度 ${value}%`}><i><b style={{ width: `${value}%` }} /></i><em>{value}%</em></span>;
}

function Field({ label, value, onChange, helper, type = "text", readOnly = false, onEnter }) {
  return <label className="hm-admin-field"><span>{label}</span><input type={type} value={value ?? ""} readOnly={readOnly} onChange={(event) => onChange?.(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") onEnter?.(); }} />{helper ? <small>{helper}</small> : null}</label>;
}

function TextArea({ label, value, onChange, helper, rows = 5 }) {
  return <label className="hm-admin-field"><span>{label}</span><textarea rows={rows} value={value || ""} onChange={(event) => onChange(event.target.value)} />{helper ? <small>{helper}</small> : null}</label>;
}

function SelectField({ label, value, onChange, options }) {
  return <label className="hm-admin-field"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}

export default AdminApp;
