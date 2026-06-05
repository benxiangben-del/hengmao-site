import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { isSupabaseConfigured } from "./lib/supabase.js";
import {
  addProductImage,
  createProduct,
  deleteProduct,
  deleteProductImage,
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
    heroTitle: "洗车机与清洁配件解决方案",
    heroDesc: "上海恒猫机电主营手提式洗车机、推车款洗车机、水枪、高压管、钢丝管等产品。",
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
};

const CATEGORY_OPTIONS = [
  { value: "portable", label: "手提式洗车机" },
  { value: "trolley", label: "推车款洗车机" },
  { value: "water-gun", label: "水枪" },
  { value: "high-pressure-hose", label: "高压管" },
  { value: "steel-wire-hose", label: "钢丝管" },
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

function AdminApp() {
  const [session, setSession] = useState(null);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [products, setProducts] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [images, setImages] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState("");
  const [tab, setTab] = useState("products");

  const selectedProduct = products.find((product) => product.id === selectedId);

  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) {
      return products;
    }
    return products.filter((product) =>
      [product.name, product.model, product.category].join(" ").toLowerCase().includes(keyword),
    );
  }, [products, search]);

  useEffect(() => {
    document.documentElement.lang = "zh-CN";
    document.title = "上海恒猫机电后台管理";
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      setError("Supabase 未配置。请先设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY。");
      return;
    }

    getSession()
      .then((nextSession) => {
        setSession(nextSession);
      })
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

  async function loadAll() {
    try {
      setLoading(true);
      setError("");
      const [nextProducts, nextSettings] = await Promise.all([
        fetchProducts({ activeOnly: false }),
        fetchSiteSettings(),
      ]);
      setProducts(nextProducts);
      setSettings({
        ...DEFAULT_SETTINGS,
        ...nextSettings,
        branding: { ...DEFAULT_SETTINGS.branding, ...(nextSettings.branding || {}) },
        home: { ...DEFAULT_SETTINGS.home, ...(nextSettings.home || {}) },
        about: { ...DEFAULT_SETTINGS.about, ...(nextSettings.about || {}) },
        contact: { ...DEFAULT_SETTINGS.contact, ...(nextSettings.contact || {}) },
      });
      setSelectedId((current) => current || nextProducts[0]?.id || "");
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadImages(productId) {
    try {
      const nextImages = await fetchProductImages(productId);
      setImages(nextImages);
    } catch (loadError) {
      setError(loadError.message);
    }
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

  async function saveProduct() {
    try {
      setStatus("正在保存产品...");
      setError("");
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
      setStatus("产品已保存。");
    } catch (saveError) {
      setError(saveError.message);
      setStatus("");
    }
  }

  async function removeProduct(product) {
    if (!window.confirm(`确认删除 ${product.name}？`)) {
      return;
    }
    try {
      await deleteProduct(product.id);
      setSelectedId("");
      await loadAll();
      setStatus("产品已删除。");
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  async function toggleProduct(product) {
    try {
      await updateProduct(product.id, { is_active: !product.is_active });
      await loadAll();
      setStatus(product.is_active ? "产品已下架。" : "产品已上架。");
    } catch (toggleError) {
      setError(toggleError.message);
    }
  }

  async function handleCoverUpload(file) {
    if (!file) {
      return;
    }
    try {
      setUploading("cover");
      const url = await uploadProductImage(file, "covers");
      updateForm("cover_url", url);
      if (selectedProduct) {
        await updateProduct(selectedProduct.id, { cover_url: url });
        await loadAll();
      }
      setStatus("主图已上传。");
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setUploading("");
    }
  }

  async function handleDetailImages(files) {
    if (!selectedProduct || !files.length) {
      setError("请先保存产品，再上传详情图。");
      return;
    }
    try {
      setUploading("images");
      for (const file of files) {
        const url = await uploadProductImage(file, "details");
        await addProductImage(selectedProduct.id, url, images.length);
      }
      await loadImages(selectedProduct.id);
      setStatus("详情图已上传。");
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setUploading("");
    }
  }

  async function handleVideoUpload(file) {
    if (!file) {
      return;
    }
    try {
      setUploading("video");
      const url = await uploadProductVideo(file);
      updateForm("video_url", url);
      if (selectedProduct) {
        await updateProduct(selectedProduct.id, { video_url: url });
        await loadAll();
      }
      setStatus("视频已上传。");
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setUploading("");
    }
  }

  async function removeImage(image) {
    try {
      await deleteProductImage(image.id);
      await loadImages(selectedProduct.id);
      setStatus("详情图记录已删除。");
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  async function saveImageSort(image, sortOrder) {
    try {
      await updateProductImage(image.id, { sort_order: Number(sortOrder) || 0 });
      await loadImages(selectedProduct.id);
    } catch (sortError) {
      setError(sortError.message);
    }
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

  async function saveSettings() {
    try {
      setStatus("正在保存公司信息...");
      await Promise.all(
        ["branding", "home", "about", "contact"].map((key) => upsertSiteSetting(key, settings[key])),
      );
      setStatus("公司信息已保存。");
    } catch (settingError) {
      setError(settingError.message);
    }
  }

  if (loading) {
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
    <div className="site-shell">
      <header className="topbar">
        <button className="brand" onClick={() => window.location.assign("/")}>
          <span className="brand-mark">HM</span>
          <span>
            <strong>上海恒猫机电后台</strong>
            <small>Supabase 实时内容管理</small>
          </span>
        </button>

        <div className="topbar-right">
          <nav className="nav">
            <button onClick={() => window.location.assign("/")}>查看官网</button>
            <button onClick={handleLogout}>退出登录</button>
          </nav>
        </div>
      </header>

      <main className="page admin-page">
        <div className="section-heading compact">
          <p className="eyebrow">Admin</p>
          <h1>内容管理系统</h1>
          <p>产品、图片、视频和公司信息均保存到 Supabase，Vercel 与 Cloudflare 会读取同一份数据。</p>
        </div>

        {status ? <div className="admin-note">{status}</div> : null}
        {error ? <div className="login-error">{error}</div> : null}

        <section className="admin-layout">
          <aside className="admin-sidebar card">
            <button className={tab === "products" ? "admin-nav active" : "admin-nav"} onClick={() => setTab("products")}>
              <span className="admin-nav-icon">P</span>
              <span>产品管理</span>
            </button>
            <button className={tab === "settings" ? "admin-nav active" : "admin-nav"} onClick={() => setTab("settings")}>
              <span className="admin-nav-icon">S</span>
              <span>公司信息</span>
            </button>
            <div className="admin-save-state">已连接 Supabase</div>
          </aside>

          <div className="admin-main">
            {tab === "products" ? (
              <div className="admin-products-layout">
                <article className="card admin-product-list">
                  <div className="admin-list-head">
                    <h3>产品列表</h3>
                    <button
                      className="primary-btn small-btn"
                      onClick={() => {
                        setSelectedId("");
                        setForm(EMPTY_FORM);
                        setImages([]);
                      }}
                    >
                      新增产品
                    </button>
                  </div>
                  <input
                    className="search-input"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="搜索型号或名称"
                  />
                  <div className="admin-product-picker">
                    {filteredProducts.map((product) => (
                      <button
                        key={product.id}
                        className={selectedId === product.id ? "admin-product-item active" : "admin-product-item"}
                        onClick={() => setSelectedId(product.id)}
                      >
                        <span>
                          <strong>{product.name}</strong>
                          <small>{product.model}</small>
                        </span>
                        <em>{product.is_active ? "已上架" : "已下架"}</em>
                      </button>
                    ))}
                  </div>
                </article>

                <article className="card admin-editor">
                  <div className="admin-list-head">
                    <h3>{selectedProduct ? "编辑产品" : "新增产品"}</h3>
                    {selectedProduct ? (
                      <div className="admin-tools-row">
                        <button className="secondary-btn small-btn" onClick={() => toggleProduct(selectedProduct)}>
                          {selectedProduct.is_active ? "下架" : "上架"}
                        </button>
                        <button className="secondary-btn small-btn" onClick={() => removeProduct(selectedProduct)}>
                          删除
                        </button>
                      </div>
                    ) : null}
                  </div>

                  <div className="form-grid two-col">
                    <AdminField label="产品名称" value={form.name} onChange={(value) => updateForm("name", value)} />
                    <AdminField label="产品型号" value={form.model} onChange={(value) => updateForm("model", value)} />
                    <AdminSelect label="产品分类" value={form.category} options={CATEGORY_OPTIONS} onChange={(value) => updateForm("category", value)} />
                    <AdminField label="排序" type="number" value={form.sort_order} onChange={(value) => updateForm("sort_order", value)} />
                  </div>

                  <label className="admin-field admin-checkbox">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(event) => updateForm("is_active", event.target.checked)}
                    />
                    <span>上架显示</span>
                  </label>

                  <AdminTextarea label="短描述" value={form.short_description} onChange={(value) => updateForm("short_description", value)} />
                  <AdminTextarea label="详情描述" value={form.description} onChange={(value) => updateForm("description", value)} />
                  <div className="form-grid two-col">
                    <AdminTextarea
                      label="产品特点"
                      helper="每行一个特点"
                      value={form.featuresText}
                      onChange={(value) => updateForm("featuresText", value)}
                    />
                    <AdminTextarea
                      label="产品参数"
                      helper="每行一个参数，例如 Power: 1200W"
                      value={form.specsText}
                      onChange={(value) => updateForm("specsText", value)}
                    />
                  </div>

                  <AdminField label="主图 URL" value={form.cover_url} onChange={(value) => updateForm("cover_url", value)} />
                  <div className="admin-upload-strip admin-tools-row">
                    <FileButton label={uploading === "cover" ? "主图上传中..." : "上传主图"} accept="image/*" onFile={handleCoverUpload} />
                    <FileButton label={uploading === "images" ? "详情图上传中..." : "上传详情图"} accept="image/*" multiple onFiles={handleDetailImages} />
                    <FileButton label={uploading === "video" ? "视频上传中..." : "上传安装视频"} accept="video/mp4,video/*" onFile={handleVideoUpload} />
                  </div>

                  {form.cover_url ? (
                    <div className="admin-preview">
                      <img src={form.cover_url} alt="" />
                      <div>
                        <p>当前主图</p>
                        <h4>{form.name || "未命名产品"}</h4>
                      </div>
                    </div>
                  ) : null}

                  <AdminField label="安装视频 URL" value={form.video_url} onChange={(value) => updateForm("video_url", value)} />
                  {form.video_url ? <video className="video-player admin-video-preview" controls src={form.video_url} /> : null}

                  <div className="admin-image-gallery">
                    {images.map((image) => (
                      <div key={image.id} className="admin-image-card">
                        <img src={image.image_url} alt="" />
                        <div className="admin-image-actions">
                          <AdminField
                            label="排序"
                            type="number"
                            value={image.sort_order}
                            onChange={(value) => saveImageSort(image, value)}
                          />
                          <button className="text-btn" onClick={() => removeImage(image)}>
                            删除
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="admin-tools-row">
                    <button className="primary-btn" onClick={saveProduct}>
                      保存产品
                    </button>
                  </div>
                </article>
              </div>
            ) : (
              <SettingsEditor settings={settings} onChange={updateSetting} onSave={saveSettings} />
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function SettingsEditor({ settings, onChange, onSave }) {
  return (
    <div className="admin-card-grid">
      <article className="card">
        <h3>品牌信息</h3>
        <AdminField label="中文名称" value={settings.branding.zhName} onChange={(value) => onChange("branding", "zhName", value)} />
        <AdminField label="英文名称" value={settings.branding.enName} onChange={(value) => onChange("branding", "enName", value)} />
        <AdminField label="中文副标题" value={settings.branding.zhSub} onChange={(value) => onChange("branding", "zhSub", value)} />
        <AdminField label="英文副标题" value={settings.branding.enSub} onChange={(value) => onChange("branding", "enSub", value)} />
      </article>
      <article className="card">
        <h3>首页信息</h3>
        <AdminField label="Hero 标签" value={settings.home.heroTag} onChange={(value) => onChange("home", "heroTag", value)} />
        <AdminField label="Hero 标题" value={settings.home.heroTitle} onChange={(value) => onChange("home", "heroTitle", value)} />
        <AdminTextarea label="Hero 描述" value={settings.home.heroDesc} onChange={(value) => onChange("home", "heroDesc", value)} />
      </article>
      <article className="card">
        <h3>公司介绍</h3>
        <AdminField label="标题" value={settings.about.title} onChange={(value) => onChange("about", "title", value)} />
        <AdminTextarea label="介绍正文" value={settings.about.body} onChange={(value) => onChange("about", "body", value)} />
      </article>
      <article className="card">
        <h3>联系方式</h3>
        <AdminField label="Email" value={settings.contact.email} onChange={(value) => onChange("contact", "email", value)} />
        <AdminField label="Phone / WhatsApp" value={settings.contact.phone} onChange={(value) => onChange("contact", "phone", value)} />
        <AdminField label="地址" value={settings.contact.address} onChange={(value) => onChange("contact", "address", value)} />
        <AdminTextarea label="联系说明" value={settings.contact.description} onChange={(value) => onChange("contact", "description", value)} />
      </article>
      <div className="admin-tools-row">
        <button className="primary-btn" onClick={onSave}>
          保存公司信息
        </button>
      </div>
    </div>
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
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default AdminApp;
