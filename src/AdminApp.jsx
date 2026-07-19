import { useEffect, useMemo, useState } from "react";
import BrandMark from "./components/BrandMark.jsx";
import Icon from "./components/Icon.jsx";
import { brand, heroProducts } from "./content/demoSite.js";
import { createDemoProductRecord, createEmptyProductRecord, PRODUCT_CATEGORIES } from "./content/productModel.js";
import { connectLocalWorkspace, downloadCatalogBackup, importLocalMedia, localWorkspaceSupported, saveLocalCatalog } from "./lib/localContentWorkspace.js";
import "./styles/tokens.css";
import "./styles/globals.css";
import "./styles/admin.css";

const CATEGORIES = PRODUCT_CATEGORIES;

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

const newProductRecord = createEmptyProductRecord;
const demoProductRecord = createDemoProductRecord;

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

function AdminApp() {
  const [workspace, setWorkspace] = useState({ connected: false, name: "", updatedAt: "" });
  const [products, setProducts] = useState(() => [demoProductRecord()]);
  const [activeNav, setActiveNav] = useState("dashboard");
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(() => newProductRecord());
  const [editorTab, setEditorTab] = useState("identity");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
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

  function showNotice(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3200);
  }

  async function handleConnectWorkspace() {
    try {
      setLoading(true);
      setError("");
      const result = await connectLocalWorkspace();
      setProducts(result.products.length ? result.products : [demoProductRecord()]);
      setWorkspace({ connected: true, name: result.name, updatedAt: result.updatedAt });
      setSelectedId(null);
      setForm(newProductRecord());
      showNotice(`已连接本地项目：${result.name}`);
    } catch (connectError) {
      if (connectError?.name !== "AbortError") setError(connectError.message || "连接项目文件夹失败。");
    } finally {
      setLoading(false);
    }
  }

  function handleBackup() {
    downloadCatalogBackup(products);
    showNotice("已导出产品目录备份。");
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
    if (record.media.filter((item) => item.role === "home-hero").length > 1) return "每款产品只能设置一张首页轮播图。";
    if (record.status === "published") {
      if (translationScore(record.translations["zh-CN"]) < 100 || translationScore(record.translations.en) < 100) return "正式发布前必须完成中英文名称、摘要、介绍和 SEO。";
      if (record.translations["zh-CN"].status !== "published" || record.translations.en.status !== "published") return "正式发布前，中英文内容都必须单独设为已发布。";
      if (!record.media.some((item) => item.role === "cover" && item.rightsStatus === "approved")) return "正式发布前必须有权属已确认的产品主图。";
      if (record.placements.homeHero && !record.media.some((item) => item.role === "home-hero" && item.kind === "image" && item.rightsStatus === "approved")) return "进入首页轮播的产品必须单独上传一张权属已确认的首页轮播图。";
      if (!record.specifications.length || record.specifications.some((item) => item.verificationStatus !== "approved" || !String(item.sourceReference || "").trim())) return "正式发布前，技术参数必须全部审核通过并填写资料来源。";
      if (record.guides.safety.technicalReviewStatus !== "approved") return "正式发布前，安全与注意事项必须通过技术审核。";
    }
    return "";
  }

  async function saveProduct() {
    if (!workspace.connected) {
      setError("请先点击右上角“连接项目文件夹”，选择 hengmao-site 根目录。");
      return;
    }
    const validationError = validateProduct(form);
    if (validationError) {
      setError(validationError);
      return;
    }
    try {
      setSaving(true);
      setError("");
      const record = { ...clone(form), id: form.id || `product-${crypto.randomUUID()}`, updatedAt: new Date().toISOString() };
      const next = selectedId
        ? products.map((product) => product.id === selectedId ? record : product)
        : [...products, record];
      const catalog = await saveLocalCatalog(next);
      setProducts(next);
      setSelectedId(record.id);
      setForm(record);
      setWorkspace((current) => ({ ...current, updatedAt: catalog.updatedAt }));
      showNotice("已写入本地产品文件和官网静态目录；发布前请执行内容校验并推送 GitHub。");
    } catch (saveError) {
      setError(saveError.message || "保存失败。");
    } finally {
      setSaving(false);
    }
  }

  async function uploadMedia(file, role) {
    if (!workspace.connected) {
      setError("请先连接 hengmao-site 项目文件夹，再导入产品素材。");
      return;
    }
    if (!form.id || !form.slug) {
      setError("请先填写型号和 URL slug，并保存产品，再导入素材。");
      return;
    }
    try {
      setMediaUploading(true);
      setError("");
      const media = await importLocalMedia(file, form.slug, role);
      setForm((current) => ({ ...current, media: [...current.media, media] }));
      showNotice("素材已复制到产品目录；请补充中英文替代文字、确认权属并保存产品。");
    } catch (uploadError) {
      setError(uploadError.message || "素材导入失败。");
    } finally {
      setMediaUploading(false);
    }
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
          <span className={`hm-admin-connection${workspace.connected ? "" : " is-preview"}`}><i />{workspace.connected ? "本地项目已连接" : "等待文件夹授权"}</span>
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
            <span className={`hm-admin-mode-pill${workspace.connected ? "" : " is-preview"}`}>{workspace.connected ? workspace.name : "未连接项目"}</span>
            <button className="hm-admin-button is-primary hm-admin-connect-action" type="button" onClick={handleConnectWorkspace}>{workspace.connected ? "重新连接" : "连接项目文件夹"}</button>
            <button className="hm-admin-button is-secondary hm-admin-backup-action" type="button" onClick={handleBackup}>导出备份</button>
            <a className="hm-admin-button is-secondary hm-admin-view-action" href="/zh/" target="_blank" rel="noreferrer">查看官网</a>
          </div>
        </header>

        <div className={`hm-admin-banner${workspace.connected ? " is-connected" : ""}`}>
          <Icon name={workspace.connected ? "check" : "folder"} size={21} />
          <div>
            <strong>{workspace.connected ? `已连接 ${workspace.name}` : "请先连接网站项目文件夹"}</strong>
            <p>{workspace.connected ? "保存产品会同时更新源记录和官网静态目录；图片、视频会复制到固定产品素材文件夹。" : "点击右上角“连接项目文件夹”，选择 C:\\Users\\XR\\Desktop\\hengmao-site。浏览器只会在您授权后读写该目录。"}</p>
          </div>
        </div>
        {notice ? <div className="hm-admin-toast is-success">{notice}</div> : null}
        {error ? <div className="hm-admin-toast is-error"><span>{error}</span><button type="button" onClick={() => setError("")}>关闭</button></div> : null}
        {loading ? <div className="hm-admin-progress">正在读取本地产品目录…</div> : null}

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
              workspaceConnected={workspace.connected}
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
          {activeNav === "settings" ? <SettingsOverview workspace={workspace} supported={localWorkspaceSupported} onConnect={handleConnectWorkspace} /> : null}
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
    products, allCount, query, statusFilter, selectedId, form, editorTab, saving, workspaceConnected, mediaUploading,
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
        {editorTab === "publishing" ? <PublishingEditor form={form} onRoot={onRoot} onPlacement={onPlacement} onList={onList} onMediaUpload={onMediaUpload} workspaceConnected={workspaceConnected} mediaUploading={mediaUploading} /> : null}
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

function PublishingEditor({ form, onRoot, onPlacement, onList, onMediaUpload, workspaceConnected, mediaUploading }) {
  const checks = [
    { label: "中文基本内容", ok: translationScore(form.translations["zh-CN"]) === 100 },
    { label: "英文基本内容", ok: translationScore(form.translations.en) === 100 },
    { label: "主图权属确认", ok: form.media.some((item) => item.role === "cover" && item.rightsStatus === "approved") },
    ...(form.placements.homeHero ? [{ label: "独立轮播图", ok: form.media.some((item) => item.role === "home-hero" && item.kind === "image" && item.rightsStatus === "approved") }] : []),
    { label: "技术参数审核", ok: form.specifications.length > 0 && form.specifications.every((item) => item.verificationStatus === "approved") },
    { label: "安全内容审核", ok: form.guides.safety.technicalReviewStatus === "approved" },
  ];
  return (
    <div className="hm-admin-editor-body">
      <SectionTitle index="06" title="媒体、推荐与发布" description="只有通过发布门槛的内容才能进入正式网站。" />
      <div className="hm-admin-publishing-grid">
        <section>
          <h3>产品媒体</h3>
          <p className="hm-admin-field-note">产品主图用于列表和详情；首页轮播图为独立素材，建议上传透明背景 PNG/WebP。新素材默认为“权属待确认”，不会直接通过发布检查。</p>
          <div className="hm-admin-upload-actions">
            {[{ role: "cover", label: "上传产品主图", accept: "image/*" }, { role: "home-hero", label: "上传首页轮播图", accept: "image/png,image/webp,image/*" }, { role: "gallery", label: "上传产品图片", accept: "image/*" }, { role: "video-demo", label: "上传产品视频", accept: "video/*" }].map((option) => (
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
          {!workspaceConnected ? <p className="hm-admin-preview-hint">连接项目文件夹后，素材将复制到 public/media/products/产品-slug/。</p> : null}
          <div className="hm-admin-media-preview-grid">
            {form.media.map((media, index) => (
              <article key={media.assetKey} className="hm-admin-media-card">
                {media.kind === "video" ? <div className="hm-admin-video-thumb"><Icon name="play" size={24} /><span>VIDEO</span></div> : <img src={media.url} alt={media.altZh || ""} />}
                <div><strong>{media.role}</strong><span className={`hm-admin-rights is-${media.rightsStatus}`}>{media.rightsStatus}</span></div>
                <label>用途<select value={media.role} onChange={(event) => onList("media", index, "role", event.target.value)}><option value="cover">产品主图 Cover</option><option value="home-hero">首页轮播图 Hero</option><option value="gallery">图库 Gallery</option><option value="detail">详情 Detail</option><option value="application">应用场景</option><option value="package">包装</option><option value="video-demo">产品视频</option><option value="video-installation">安装视频</option><option value="video-usage">使用视频</option><option value="video-maintenance">维护视频</option></select></label>
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
          <label className="hm-admin-toggle"><input type="checkbox" checked={form.placements.homeHero} onChange={(event) => onPlacement("homeHero", event.target.checked)} /><span /><div><strong>进入首页机器轮播</strong><small>启用后必须设置独立轮播图；不再自动复用产品主图</small></div></label>
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
        <div className="hm-admin-asset-grid">{media.map((item) => <button key={`${item.product.id}-${item.assetKey}`} type="button" onClick={() => onOpen(item.product)}>{item.kind === "video" ? <span className="hm-admin-video-thumb"><Icon name="play" size={24} /><small>VIDEO</small></span> : <img src={item.url} alt={item.altZh || ""} />}<span><strong>{item.product.translations["zh-CN"].name}</strong><small>{item.role} · {item.assetKey}</small><em className={`hm-admin-rights is-${item.rightsStatus}`}>{item.rightsStatus}</em></span></button>)}</div>
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
        <div className="hm-admin-record-list">{products.filter((product) => product.placements.homeHero).map((product) => { const hasHero = product.media?.some((item) => item.role === "home-hero" && item.kind === "image" && item.rightsStatus === "approved"); return <button key={product.id} type="button" onClick={() => onOpen(product)}><ProductThumb product={product} role="home-hero" /><span><strong>{product.translations["zh-CN"].name}</strong><small>轮播顺序 {product.placements.homeHeroOrder} · {hasHero ? "专用轮播图已设置" : "缺少专用轮播图"}</small></span><em className={`hm-admin-status is-${product.status}`}>{statusLabel(product.status)}</em></button>; })}</div>
      </section>
    </div>
  );
}

function SettingsOverview({ workspace, supported, onConnect }) {
  return (
    <div className="hm-admin-stack">
      <section className="hm-admin-intro"><div><p className="hm-admin-kicker">SITE SETTINGS</p><h2>品牌与站点配置</h2><p>产品数据与站点固定信息分开管理，避免修改产品时影响品牌结构。</p></div></section>
      <div className="hm-admin-settings-grid">
        <section className="hm-admin-panel"><PanelHeading eyebrow="BRAND" title="品牌基线" /><Field label="中文名称" value="上海恒猫机电" readOnly /><Field label="English name" value="Shanghai Hengmao Machinery" readOnly /><Field label="品牌口号" value="可靠设备，清洁更高效" readOnly /></section>
        <section className="hm-admin-panel">
          <PanelHeading eyebrow="LOCAL WORKSPACE" title="本地内容数据源" />
          <div className="hm-admin-data-status">
            <span className={workspace.connected ? "is-live" : "is-preview"}>{workspace.connected ? "本地项目已连接" : "等待连接"}</span>
            <p>{workspace.connected ? `当前项目：${workspace.name}。产品记录写入 content/products，官网目录写入 public/content/catalog.json。` : supported ? "请选择 hengmao-site 根目录并授予读写权限。" : "当前浏览器不支持本地文件读写，请使用最新版 Chrome 或 Edge。"}</p>
            <button className="hm-admin-button is-primary" type="button" onClick={onConnect}>{workspace.connected ? "重新连接项目" : "连接项目文件夹"}</button>
          </div>
        </section>
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

function ProductThumb({ product, role = "cover" }) {
  const image = product.media?.find((item) => item.role === role && item.kind === "image");
  return image ? <img className="hm-admin-product-thumb" src={image.url} alt="" /> : <span className="hm-admin-product-thumb is-empty">HM</span>;
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
