import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { isSupabaseConfigured } from "./lib/supabase.js";
import {
  addProductImage,
  createProduct,
  deleteProduct,
  deleteProductImage,
  fetchAllProductImages,
  fetchProductImages,
  fetchProducts,
  fetchSiteSettings,
  getSession,
  signIn,
  signOut,
  updateProduct,
  updateProductImage,
  uploadProductImage,
  uploadProductVideo,
  upsertSiteSetting,
} from "./lib/siteApi.js";

const EMPTY_FORM = {
  name: "",
  model: "",
  category: "portable",
  cover_url: "",
  short_description: "",
  description: "",
  specsText: "",
  featuresText: "",
  video_url: "",
  sort_order: 0,
  is_active: true,
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
    heroDesc: "上海恒猫机电主营手提式洗车机、推车款洗车机、水枪、高压管、钢丝管等产品。",
    heroDescZh: "上海恒猫机电主营手提式洗车机、推车款洗车机、水枪、高压管、钢丝管等产品。",
    heroDescEn:
      "Shanghai Hengmao Machinery supplies portable car washers, trolley pressure washers, spray guns, high pressure hoses, and steel wire hoses.",
  },
  about: {
    title: "公司介绍",
    body: "上海恒猫机电专注于洗车机及清洁配件的展示与供应。",
  },
  contact: {
    email: "sales@hengmao.com",
    phone: "+86-000-0000-0000",
    address: "中国上海",
    description: "欢迎联系上海恒猫机电获取产品资料和报价支持。",
  },
  support: {
    searchDesc: "输入产品型号，快速找到对应产品和安装视频。",
    videoCta: "查看安装视频",
  },
  faq: [
    { question: "如何查找安装视频？", answer: "在帮助页面输入产品型号，即可打开对应产品的视频入口。" },
  ],
};

const CATEGORY_OPTIONS = [
  { value: "portable", labelZh: "手提式洗车机", labelEn: "Portable Car Washer" },
  { value: "trolley", labelZh: "推车款洗车机", labelEn: "Trolley Pressure Washer" },
  { value: "water-gun", labelZh: "水枪", labelEn: "Spray Gun" },
  { value: "high-pressure-hose", labelZh: "高压管", labelEn: "High Pressure Hose" },
  { value: "steel-wire-hose", labelZh: "钢丝管", labelEn: "Steel Wire Hose" },
];

const NAV_ITEMS = [
  { key: "dashboard", label: "首页概览", icon: "D" },
  { key: "products", label: "产品管理", icon: "P" },
  { key: "media", label: "媒体管理", icon: "M" },
  { key: "settings", label: "公司信息", icon: "S" },
  { key: "support", label: "支持中心", icon: "Q" },
];

function specsToText(specs) {
  return Object.entries(specs || {})
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
}

function textToSpecs(text) {
  return String(text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .reduce((specs, line) => {
      const [key, ...rest] = line.split(":");
      if (key?.trim()) {
        specs[key.trim()] = rest.join(":").trim();
      }
      return specs;
    }, {});
}

function textToFeatures(text) {
  return String(text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function productToForm(product) {
  if (!product) {
    return EMPTY_FORM;
  }
  return {
    name: product.name || "",
    model: product.model || "",
    category: product.category || "portable",
    cover_url: product.cover_url || "",
    short_description: product.short_description || "",
    description: product.description || "",
    specsText: specsToText(product.specs),
    featuresText: (product.features || []).join("\n"),
    video_url: product.video_url || "",
    sort_order: product.sort_order || 0,
    is_active: product.is_active !== false,
  };
}

function formToPayload(form) {
  return {
    name: form.name.trim(),
    model: form.model.trim(),
    category: form.category.trim(),
    cover_url: form.cover_url.trim() || null,
    short_description: form.short_description.trim() || null,
    description: form.description.trim() || null,
    specs: textToSpecs(form.specsText),
    features: textToFeatures(form.featuresText),
    video_url: form.video_url.trim() || null,
    sort_order: Number(form.sort_order) || 0,
    is_active: Boolean(form.is_active),
  };
}

function categoryLabel(value, lang = "zh") {
  const category = CATEGORY_OPTIONS.find((item) => item.value === value);
  if (!category) {
    return value || "-";
  }
  return lang === "en" ? category.labelEn : category.labelZh;
}

function byNewestUpdate(a, b) {
  return new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0);
}

function AdminApp() {
  const [session, setSession] = useState(null);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [products, setProducts] = useState([]);
  const [allImages, setAllImages] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [images, setImages] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [filters, setFilters] = useState({ search: "", category: "all", status: "all", mediaProduct: "all" });
  const [tab, setTab] = useState("dashboard");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState("");

  const selectedProduct = products.find((product) => product.id === selectedId);

  const filteredProducts = useMemo(() => {
    const keyword = filters.search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesKeyword = keyword
        ? [product.name, product.model, product.category].join(" ").toLowerCase().includes(keyword)
        : true;
      const matchesCategory = filters.category === "all" || product.category === filters.category;
      const matchesStatus =
        filters.status === "all" ||
        (filters.status === "active" && product.is_active) ||
        (filters.status === "inactive" && !product.is_active);
      return matchesKeyword && matchesCategory && matchesStatus;
    });
  }, [filters, products]);

  const dashboard = useMemo(() => {
    const activeCount = products.filter((product) => product.is_active).length;
    const videoCount = products.filter((product) => product.video_url).length;
    return {
      total: products.length,
      active: activeCount,
      inactive: products.length - activeCount,
      images: allImages.length,
      videos: videoCount,
      recent: [...products].sort(byNewestUpdate).slice(0, 5),
    };
  }, [allImages.length, products]);

  const videoMedia = useMemo(
    () => products.filter((product) => product.video_url && (filters.mediaProduct === "all" || product.id === filters.mediaProduct)),
    [filters.mediaProduct, products],
  );

  const imageMedia = useMemo(
    () => allImages.filter((image) => filters.mediaProduct === "all" || image.product_id === filters.mediaProduct),
    [allImages, filters.mediaProduct],
  );

  useEffect(() => {
    document.documentElement.lang = "zh-CN";
    document.title = "上海恒猫机电后台管理";
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      setError("Supabase 未配置。请设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY。");
      return;
    }

    getSession()
      .then((nextSession) => setSession(nextSession))
      .catch((sessionError) => setError(sessionError.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (session) {
      loadAll();
    }
  }, [session]);

  useEffect(() => {
    setForm(productToForm(selectedProduct));
    if (selectedProduct?.id) {
      loadImages(selectedProduct.id);
    } else {
      setImages([]);
    }
  }, [selectedProduct?.id]);

  function notify(message) {
    setStatus(message);
    window.setTimeout(() => setStatus(""), 2800);
  }

  async function runTask(task, successMessage) {
    try {
      setSaving(true);
      setError("");
      await task();
      if (successMessage) {
        notify(successMessage);
      }
    } catch (taskError) {
      setError(taskError.message || "操作失败，请稍后重试。");
    } finally {
      setUploading("");
      setSaving(false);
    }
  }

  async function loadAll() {
    await runTask(async () => {
      try {
        setLoading(true);
        const [nextProducts, nextSettings, nextImages] = await Promise.all([
          fetchProducts({ activeOnly: false }),
          fetchSiteSettings(),
          fetchAllProductImages(),
        ]);
        setProducts(nextProducts);
        setAllImages(nextImages);
        setSettings({
          ...DEFAULT_SETTINGS,
          ...nextSettings,
          branding: { ...DEFAULT_SETTINGS.branding, ...(nextSettings.branding || {}) },
          home: { ...DEFAULT_SETTINGS.home, ...(nextSettings.home || {}) },
          about: { ...DEFAULT_SETTINGS.about, ...(nextSettings.about || {}) },
          contact: { ...DEFAULT_SETTINGS.contact, ...(nextSettings.contact || {}) },
          support: { ...DEFAULT_SETTINGS.support, ...(nextSettings.support || {}) },
          faq: Array.isArray(nextSettings.faq) ? nextSettings.faq : DEFAULT_SETTINGS.faq,
        });
        setSelectedId((current) => current || nextProducts[0]?.id || "");
      } finally {
        setLoading(false);
      }
    });
  }

  async function loadImages(productId) {
    await runTask(async () => {
      const nextImages = await fetchProductImages(productId);
      setImages(nextImages);
    });
  }

  async function handleLogin() {
    try {
      setLoginError("");
      const { session: nextSession } = await signIn(loginForm.email, loginForm.password);
      setSession(nextSession);
    } catch (signInError) {
      setLoginError(signInError.message || "登录失败，请检查邮箱、密码和 Supabase Auth 用户。");
    }
  }

  async function handleLogout() {
    await signOut();
    setSession(null);
    setProducts([]);
    setSelectedId("");
  }

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateFilter(field, value) {
    setFilters((current) => ({ ...current, [field]: value }));
  }

  function startNewProduct() {
    setSelectedId("");
    setForm(EMPTY_FORM);
    setImages([]);
    setTab("products");
  }

  function editProduct(product) {
    setSelectedId(product.id);
    setTab("products");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveProduct() {
    await runTask(async () => {
      const payload = formToPayload(form);
      if (!payload.name || !payload.model || !payload.category) {
        throw new Error("产品名称、型号、分类不能为空。");
      }

      if (selectedProduct) {
        await updateProduct(selectedProduct.id, payload);
      } else {
        const created = await createProduct(payload);
        setSelectedId(created.id);
      }
      await loadAll();
    }, "产品已保存。");
  }

  async function removeProduct(product) {
    if (!window.confirm(`确认删除「${product.name}」？删除后前台将不再显示该产品。`)) {
      return;
    }
    await runTask(async () => {
      await deleteProduct(product.id);
      setSelectedId("");
      await loadAll();
    }, "产品已删除。");
  }

  async function toggleProduct(product) {
    await runTask(async () => {
      await updateProduct(product.id, { is_active: !product.is_active });
      await loadAll();
    }, product.is_active ? "产品已下架。" : "产品已上架。");
  }

  async function copyText(value, label = "内容") {
    await navigator.clipboard.writeText(value || "");
    notify(`${label}已复制。`);
  }

  async function handleCoverUpload(file) {
    if (!file) {
      return;
    }
    await runTask(async () => {
      setUploading("cover");
      const url = await uploadProductImage(file, "covers");
      updateForm("cover_url", url);
      if (selectedProduct) {
        await updateProduct(selectedProduct.id, { cover_url: url });
        await loadAll();
      }
      setUploading("");
    }, "主图已上传。");
  }

  async function handleDetailImages(files) {
    if (!selectedProduct || !files.length) {
      setError("请先保存产品，再上传详情图。");
      return;
    }
    await runTask(async () => {
      setUploading("images");
      for (const [index, file] of files.entries()) {
        const url = await uploadProductImage(file, "details");
        await addProductImage(selectedProduct.id, url, images.length + index);
      }
      await Promise.all([loadImages(selectedProduct.id), loadAll()]);
      setUploading("");
    }, "详情图已上传。");
  }

  async function handleVideoUpload(file) {
    if (!file) {
      return;
    }
    await runTask(async () => {
      setUploading("video");
      const url = await uploadProductVideo(file);
      updateForm("video_url", url);
      if (selectedProduct) {
        await updateProduct(selectedProduct.id, { video_url: url });
        await loadAll();
      }
      setUploading("");
    }, "视频已上传。");
  }

  async function removeImage(image) {
    if (!window.confirm("确认删除这条详情图记录？Storage 文件第一版不会删除。")) {
      return;
    }
    await runTask(async () => {
      await deleteProductImage(image.id);
      await Promise.all([loadImages(selectedProduct.id), loadAll()]);
    }, "详情图记录已删除。");
  }

  async function saveImageSort(image, sortOrder) {
    await runTask(async () => {
      await updateProductImage(image.id, { sort_order: Number(sortOrder) || 0 });
      await Promise.all([loadImages(image.product_id), loadAll()]);
    }, "图片排序已更新。");
  }

  function updateSetting(section, field, value) {
    setSettings((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [field]: value,
      },
    }));
  }

  function updateFaq(index, field, value) {
    setSettings((current) => ({
      ...current,
      faq: current.faq.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    }));
  }

  function addFaq() {
    setSettings((current) => ({
      ...current,
      faq: [...current.faq, { question: "", answer: "" }],
    }));
  }

  function removeFaq(index) {
    setSettings((current) => ({
      ...current,
      faq: current.faq.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  async function saveSettings(keys = ["branding", "home", "about", "contact"]) {
    await runTask(async () => {
      await Promise.all(keys.map((key) => upsertSiteSetting(key, settings[key])));
    }, "设置已保存，前台将读取同一份 Supabase 数据。");
  }

  if (loading && !session) {
    return <div className="empty-state">正在加载后台...</div>;
  }

  if (!session) {
    return (
      <div className="site-shell admin-login-shell">
        <div className="admin-login-card">
          <div className="brand admin-login-brand">
            <span className="brand-mark">HM</span>
            <span>
              <strong>上海恒猫机电后台</strong>
              <small>Supabase Auth 邮箱密码登录</small>
            </span>
          </div>

          <div className="admin-login-form">
            {!isSupabaseConfigured ? <div className="login-error">{error}</div> : null}
            <AdminField
              label="邮箱"
              value={loginForm.email}
              onChange={(value) => setLoginForm((current) => ({ ...current, email: value }))}
            />
            <AdminField
              label="密码"
              type="password"
              value={loginForm.password}
              onChange={(value) => setLoginForm((current) => ({ ...current, password: value }))}
              onEnter={handleLogin}
            />
            {loginError ? <div className="login-error">{loginError}</div> : null}
            <div className="admin-login-actions">
              <button className="primary-btn" onClick={handleLogin} disabled={!isSupabaseConfigured}>
                登录后台
              </button>
              <button className="secondary-btn" onClick={() => window.location.assign("/")}>
                返回官网
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="site-shell admin-cms-shell">
      <aside className="admin-cms-sidebar">
        <button className="brand admin-cms-brand" onClick={() => setTab("dashboard")}>
          <span className="brand-mark">HM</span>
          <span>
            <strong>恒猫 CMS</strong>
            <small>Supabase 管理系统</small>
          </span>
        </button>

        <nav className="admin-cms-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              className={tab === item.key ? "admin-nav active" : "admin-nav"}
              onClick={() => setTab(item.key)}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="admin-save-state">
          <strong>数据源</strong>
          <span>Supabase</span>
        </div>
      </aside>

      <div className="admin-cms-workspace">
        <header className="admin-cms-topbar">
          <div>
            <p className="eyebrow">Admin</p>
            <h1>{NAV_ITEMS.find((item) => item.key === tab)?.label}</h1>
          </div>
          <div className="admin-top-actions">
            {saving ? <span className="admin-pill">处理中...</span> : <span className="admin-pill online">已连接</span>}
            <button className="secondary-btn small-btn" onClick={() => window.location.assign("/")}>
              查看官网
            </button>
            <button className="secondary-btn small-btn" onClick={handleLogout}>
              退出
            </button>
          </div>
        </header>

        {status ? <div className="admin-toast success">{status}</div> : null}
        {error ? <div className="admin-toast error">{error}</div> : null}
        {loading ? <div className="empty-state">正在同步 Supabase 数据...</div> : null}

        <main className="admin-cms-main">
          {tab === "dashboard" ? (
            <DashboardPanel
              dashboard={dashboard}
              onNew={startNewProduct}
              onSettings={() => setTab("settings")}
              onViewSite={() => window.location.assign("/")}
              onEdit={editProduct}
            />
          ) : null}

          {tab === "products" ? (
            <ProductsPanel
              products={filteredProducts}
              allProducts={products}
              filters={filters}
              selectedProduct={selectedProduct}
              selectedId={selectedId}
              form={form}
              images={images}
              uploading={uploading}
              onFilter={updateFilter}
              onEdit={editProduct}
              onNew={startNewProduct}
              onForm={updateForm}
              onSave={saveProduct}
              onCancel={() => {
                setForm(productToForm(selectedProduct));
                if (!selectedProduct) {
                  setSelectedId(products[0]?.id || "");
                }
              }}
              onToggle={toggleProduct}
              onDelete={removeProduct}
              onCopy={copyText}
              onCoverUpload={handleCoverUpload}
              onDetailImages={handleDetailImages}
              onVideoUpload={handleVideoUpload}
              onRemoveImage={removeImage}
              onImageSort={saveImageSort}
            />
          ) : null}

          {tab === "media" ? (
            <MediaPanel
              products={products}
              imageMedia={imageMedia}
              videoMedia={videoMedia}
              mediaProduct={filters.mediaProduct}
              onFilter={(value) => updateFilter("mediaProduct", value)}
              onCopy={copyText}
              onDeleteImage={removeImage}
            />
          ) : null}

          {tab === "settings" ? (
            <SettingsPanel
              settings={settings}
              onChange={updateSetting}
              onSave={() => saveSettings(["branding", "home", "about", "contact"])}
            />
          ) : null}

          {tab === "support" ? (
            <SupportPanel
              settings={settings}
              onChange={updateSetting}
              onFaq={updateFaq}
              onAddFaq={addFaq}
              onRemoveFaq={removeFaq}
              onSave={() => saveSettings(["support", "faq"])}
            />
          ) : null}
        </main>
      </div>
    </div>
  );
}

function DashboardPanel({ dashboard, onNew, onSettings, onViewSite, onEdit }) {
  return (
    <div className="admin-dashboard">
      <div className="admin-stat-grid">
        <StatCard label="产品总数" value={dashboard.total} />
        <StatCard label="已上架" value={dashboard.active} />
        <StatCard label="已下架" value={dashboard.inactive} />
        <StatCard label="详情图片" value={dashboard.images} />
        <StatCard label="视频产品" value={dashboard.videos} />
      </div>

      <section className="card">
        <div className="admin-list-head">
          <h3>快捷入口</h3>
        </div>
        <div className="admin-quick-grid">
          <button className="primary-btn" onClick={onNew}>新增产品</button>
          <button className="secondary-btn" onClick={onSettings}>编辑公司信息</button>
          <button className="secondary-btn" onClick={onViewSite}>查看官网</button>
        </div>
      </section>

      <section className="card">
        <div className="admin-list-head">
          <h3>最近更新产品</h3>
        </div>
        {dashboard.recent.length ? (
          <div className="admin-recent-list">
            {dashboard.recent.map((product) => (
              <button key={product.id} className="admin-recent-item" onClick={() => onEdit(product)}>
                {product.cover_url ? <img src={product.cover_url} alt="" /> : <span className="admin-thumb-empty">HM</span>}
                <span>
                  <strong>{product.name}</strong>
                  <small>{product.model} · {product.is_active ? "已上架" : "已下架"}</small>
                </span>
                <em>{product.sort_order}</em>
              </button>
            ))}
          </div>
        ) : (
          <div className="empty-state">暂无产品</div>
        )}
      </section>
    </div>
  );
}

function ProductsPanel(props) {
  const {
    products,
    allProducts,
    filters,
    selectedProduct,
    selectedId,
    form,
    images,
    uploading,
    onFilter,
    onEdit,
    onNew,
    onForm,
    onSave,
    onCancel,
    onToggle,
    onDelete,
    onCopy,
    onCoverUpload,
    onDetailImages,
    onVideoUpload,
    onRemoveImage,
    onImageSort,
  } = props;

  return (
    <div className="admin-product-suite">
      <section className="card">
        <div className="admin-list-head">
          <div>
            <h3>产品表格</h3>
            <p>共 {products.length} / {allProducts.length} 个产品</p>
          </div>
          <button className="primary-btn small-btn" onClick={onNew}>新增产品</button>
        </div>

        <div className="admin-filter-bar">
          <input
            className="search-input"
            value={filters.search}
            onChange={(event) => onFilter("search", event.target.value)}
            placeholder="搜索名称或型号"
          />
          <select value={filters.category} onChange={(event) => onFilter("category", event.target.value)}>
            <option value="all">全部分类</option>
            {CATEGORY_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.labelZh}</option>)}
          </select>
          <select value={filters.status} onChange={(event) => onFilter("status", event.target.value)}>
            <option value="all">全部状态</option>
            <option value="active">已上架</option>
            <option value="inactive">已下架</option>
          </select>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>主图</th>
                <th>名称</th>
                <th>型号</th>
                <th>分类</th>
                <th>状态</th>
                <th>排序</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className={selectedId === product.id ? "active" : ""}>
                  <td>{product.cover_url ? <img className="admin-table-thumb" src={product.cover_url} alt="" /> : <span className="admin-thumb-empty">HM</span>}</td>
                  <td><button className="text-btn" onClick={() => onEdit(product)}>{product.name}</button></td>
                  <td>
                    <button className="admin-copy-code" onClick={() => onCopy(product.model, "型号")}>{product.model}</button>
                  </td>
                  <td>{categoryLabel(product.category)}</td>
                  <td><span className={product.is_active ? "admin-status active" : "admin-status"}>{product.is_active ? "上架" : "下架"}</span></td>
                  <td>{product.sort_order}</td>
                  <td>
                    <div className="admin-row-actions">
                      <button className="secondary-btn small-btn" onClick={() => onToggle(product)}>{product.is_active ? "下架" : "上架"}</button>
                      <button className="secondary-btn small-btn" onClick={() => onEdit(product)}>编辑</button>
                      <button className="secondary-btn small-btn danger" onClick={() => onDelete(product)}>删除</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!products.length ? <div className="empty-state">暂无符合条件的产品</div> : null}
        </div>
      </section>

      <ProductEditor
        selectedProduct={selectedProduct}
        form={form}
        images={images}
        uploading={uploading}
        onForm={onForm}
        onSave={onSave}
        onCancel={onCancel}
        onCoverUpload={onCoverUpload}
        onDetailImages={onDetailImages}
        onVideoUpload={onVideoUpload}
        onRemoveImage={onRemoveImage}
        onImageSort={onImageSort}
      />
    </div>
  );
}

function ProductEditor({
  selectedProduct,
  form,
  images,
  uploading,
  onForm,
  onSave,
  onCancel,
  onCoverUpload,
  onDetailImages,
  onVideoUpload,
  onRemoveImage,
  onImageSort,
}) {
  return (
    <section className="card admin-editor">
      <div className="admin-list-head">
        <div>
          <h3>{selectedProduct ? "产品编辑" : "新增产品"}</h3>
          <p>{selectedProduct ? selectedProduct.model : "保存后即可上传详情图"}</p>
        </div>
        <div className="admin-tools-row compact">
          <button className="secondary-btn small-btn" onClick={onCancel}>取消编辑</button>
          <button className="primary-btn small-btn" onClick={onSave}>保存产品</button>
        </div>
      </div>

      <div className="form-grid two-col">
        <AdminField label="产品名称" value={form.name} onChange={(value) => onForm("name", value)} />
        <AdminField label="产品型号" value={form.model} onChange={(value) => onForm("model", value)} />
        <AdminSelect label="产品分类" value={form.category} options={CATEGORY_OPTIONS} onChange={(value) => onForm("category", value)} />
        <AdminField label="排序" type="number" value={form.sort_order} onChange={(value) => onForm("sort_order", value)} />
      </div>

      <label className="admin-field admin-checkbox">
        <input type="checkbox" checked={form.is_active} onChange={(event) => onForm("is_active", event.target.checked)} />
        <span>上架显示</span>
      </label>

      <AdminTextarea label="短描述" value={form.short_description} onChange={(value) => onForm("short_description", value)} />
      <AdminTextarea label="详情描述" value={form.description} onChange={(value) => onForm("description", value)} />
      <div className="form-grid two-col">
        <AdminTextarea label="产品特点" helper="每行一个特点" value={form.featuresText} onChange={(value) => onForm("featuresText", value)} />
        <AdminTextarea label="产品参数" helper="每行一个参数，例如 Power: 1200W" value={form.specsText} onChange={(value) => onForm("specsText", value)} />
      </div>

      <AdminField label="主图 URL" value={form.cover_url} onChange={(value) => onForm("cover_url", value)} />
      <div className="admin-upload-strip admin-tools-row">
        <FileButton label={uploading === "cover" ? "主图上传中..." : "上传主图"} accept="image/*" onFile={onCoverUpload} />
        <FileButton label={uploading === "images" ? "详情图上传中..." : "上传详情图"} accept="image/*" multiple onFiles={onDetailImages} />
        <FileButton label={uploading === "video" ? "视频上传中..." : "上传安装视频"} accept="video/mp4,video/*" onFile={onVideoUpload} />
      </div>

      {form.cover_url ? (
        <div className="admin-preview">
          <img src={form.cover_url} alt="" />
          <div>
            <p>主图预览</p>
            <h4>{form.name || "未命名产品"}</h4>
          </div>
        </div>
      ) : null}

      <AdminField label="安装视频 URL" value={form.video_url} onChange={(value) => onForm("video_url", value)} />
      {form.video_url ? <video className="video-player admin-video-preview" controls src={form.video_url} /> : null}

      <div className="admin-media-heading">
        <h4>详情图</h4>
        <span>{images.length} 张</span>
      </div>
      <div className="admin-image-gallery">
        {images.map((image) => (
          <div key={image.id} className="admin-image-card">
            <img src={image.image_url} alt="" />
            <div className="admin-image-actions">
              <AdminField label="排序" type="number" value={image.sort_order} onChange={(value) => onImageSort(image, value)} />
              <button className="text-btn" onClick={() => onRemoveImage(image)}>删除</button>
            </div>
          </div>
        ))}
        {!images.length ? <div className="empty-state">暂无详情图</div> : null}
      </div>
    </section>
  );
}

function MediaPanel({ products, imageMedia, videoMedia, mediaProduct, onFilter, onCopy, onDeleteImage }) {
  const productName = (productId) => products.find((product) => product.id === productId)?.name || "未关联产品";

  return (
    <div className="admin-media-page">
      <section className="card">
        <div className="admin-list-head">
          <div>
            <h3>媒体筛选</h3>
            <p>第一版删除图片只删除数据库记录，不删除 Storage 文件。</p>
          </div>
          <select value={mediaProduct} onChange={(event) => onFilter(event.target.value)}>
            <option value="all">全部产品</option>
            {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
          </select>
        </div>
      </section>

      <section className="card">
        <div className="admin-list-head">
          <h3>产品详情图</h3>
          <span>{imageMedia.length} 条记录</span>
        </div>
        <div className="admin-media-grid">
          {imageMedia.map((image) => (
            <article key={image.id} className="admin-media-card">
              <img src={image.image_url} alt="" />
              <h4>{productName(image.product_id)}</h4>
              <p>{image.image_url}</p>
              <div className="admin-tools-row compact">
                <button className="secondary-btn small-btn" onClick={() => onCopy(image.image_url, "图片 URL")}>复制 URL</button>
                <button className="secondary-btn small-btn danger" onClick={() => onDeleteImage(image)}>删除记录</button>
              </div>
            </article>
          ))}
        </div>
        {!imageMedia.length ? <div className="empty-state">暂无图片记录</div> : null}
      </section>

      <section className="card">
        <div className="admin-list-head">
          <h3>安装视频</h3>
          <span>{videoMedia.length} 个视频产品</span>
        </div>
        <div className="admin-media-grid">
          {videoMedia.map((product) => (
            <article key={product.id} className="admin-media-card">
              <video controls src={product.video_url} />
              <h4>{product.name}</h4>
              <p>{product.video_url}</p>
              <button className="secondary-btn small-btn" onClick={() => onCopy(product.video_url, "视频 URL")}>复制 URL</button>
            </article>
          ))}
        </div>
        {!videoMedia.length ? <div className="empty-state">暂无视频</div> : null}
      </section>
    </div>
  );
}

function SettingsPanel({ settings, onChange, onSave }) {
  return (
    <div className="admin-card-grid">
      <article className="card">
        <h3>品牌信息</h3>
        <AdminField label="品牌名称" value={settings.branding.zhName} onChange={(value) => onChange("branding", "zhName", value)} />
        <AdminField label="英文名称" value={settings.branding.enName} onChange={(value) => onChange("branding", "enName", value)} />
        <AdminField label="中文副标题" value={settings.branding.zhSub} onChange={(value) => onChange("branding", "zhSub", value)} />
        <AdminField label="英文副标题" value={settings.branding.enSub} onChange={(value) => onChange("branding", "enSub", value)} />
      </article>
      <article className="card">
        <h3>首页 Hero</h3>
        <AdminField label="中文 Hero 标签" value={settings.home.heroTagZh || settings.home.heroTag || ""} onChange={(value) => onChange("home", "heroTagZh", value)} />
        <AdminField label="英文 Hero 标签" value={settings.home.heroTagEn || settings.home.heroTag || ""} onChange={(value) => onChange("home", "heroTagEn", value)} />
        <AdminField label="中文 Hero 标题" value={settings.home.heroTitleZh || settings.home.heroTitle || ""} onChange={(value) => onChange("home", "heroTitleZh", value)} />
        <AdminField label="英文 Hero 标题" value={settings.home.heroTitleEn || settings.home.heroTitle || ""} onChange={(value) => onChange("home", "heroTitleEn", value)} />
        <AdminTextarea label="中文 Hero 描述" value={settings.home.heroDescZh || settings.home.heroDesc || ""} onChange={(value) => onChange("home", "heroDescZh", value)} />
        <AdminTextarea label="英文 Hero 描述" value={settings.home.heroDescEn || settings.home.heroDesc || ""} onChange={(value) => onChange("home", "heroDescEn", value)} />
      </article>
      <article className="card">
        <h3>公司介绍</h3>
        <AdminField label="公司介绍标题" value={settings.about.title} onChange={(value) => onChange("about", "title", value)} />
        <AdminTextarea label="公司介绍正文" value={settings.about.body} onChange={(value) => onChange("about", "body", value)} />
      </article>
      <article className="card">
        <h3>联系方式</h3>
        <AdminField label="联系邮箱" value={settings.contact.email} onChange={(value) => onChange("contact", "email", value)} />
        <AdminField label="电话 / WhatsApp" value={settings.contact.phone} onChange={(value) => onChange("contact", "phone", value)} />
        <AdminField label="地址" value={settings.contact.address} onChange={(value) => onChange("contact", "address", value)} />
        <AdminTextarea label="联系说明" value={settings.contact.description} onChange={(value) => onChange("contact", "description", value)} />
      </article>
      <div className="admin-tools-row">
        <button className="primary-btn" onClick={onSave}>保存公司信息</button>
      </div>
    </div>
  );
}

function SupportPanel({ settings, onChange, onFaq, onAddFaq, onRemoveFaq, onSave }) {
  return (
    <div className="admin-card-grid">
      <article className="card">
        <h3>支持中心设置</h3>
        <AdminTextarea label="型号搜索说明文案" value={settings.support.searchDesc} onChange={(value) => onChange("support", "searchDesc", value)} />
        <AdminField label="视频入口文案" value={settings.support.videoCta} onChange={(value) => onChange("support", "videoCta", value)} />
      </article>

      <article className="card">
        <div className="admin-list-head">
          <h3>常见问题 FAQ</h3>
          <button className="secondary-btn small-btn" onClick={onAddFaq}>新增 FAQ</button>
        </div>
        <div className="admin-faq-list">
          {settings.faq.map((item, index) => (
            <div key={`${item.question}-${index}`} className="admin-faq-item">
              <AdminField label="问题" value={item.question} onChange={(value) => onFaq(index, "question", value)} />
              <AdminTextarea label="回答" value={item.answer} onChange={(value) => onFaq(index, "answer", value)} />
              <button className="text-btn" onClick={() => onRemoveFaq(index)}>删除 FAQ</button>
            </div>
          ))}
        </div>
      </article>

      <div className="admin-tools-row">
        <button className="primary-btn" onClick={onSave}>保存支持中心配置</button>
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <article className="admin-stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function FileButton({ label, accept, multiple = false, onFile, onFiles }) {
  return (
    <label className="secondary-btn small-btn">
      {label}
      <input
        className="hidden-input"
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={(event) => {
          const files = Array.from(event.target.files || []);
          if (multiple) {
            onFiles?.(files);
          } else {
            onFile?.(files[0]);
          }
          event.target.value = "";
        }}
      />
    </label>
  );
}

function AdminField({ label, value, onChange, helper, type = "text", onEnter }) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            onEnter?.();
          }
        }}
      />
      {helper ? <small>{helper}</small> : null}
    </label>
  );
}

function AdminTextarea({ label, value, onChange, helper }) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={5} />
      {helper ? <small>{helper}</small> : null}
    </label>
  );
}

function AdminSelect({ label, value, options, onChange }) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.labelZh || option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default AdminApp;
