import { useEffect, useRef, useState } from "react";
import "./App.css";
import {
  cloudEnabled,
  cloudSignIn,
  cloudSignOut,
  getCloudSession,
  saveSiteContent,
  uploadImagesToCloud,
  uploadVideosToCloud,
} from "./cloud.js";
import {
  adminUi,
  createProductDraft,
  defaultSiteData,
  parseLines,
  parseSpecs,
  useSiteData,
} from "./siteData.js";

const ADMIN_SESSION_KEY = "hengmao-admin-session";

const adminIcons = {
  site: "S",
  home: "H",
  about: "A",
  products: "P",
  contact: "C",
  tools: "T",
};

function slugifyCategoryKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function AdminApp() {
  const [lang, setLang] = useState("zh");
  const [siteData, setSiteData, hydrated] = useSiteData();
  const [adminTab, setAdminTab] = useState("products");
  const [adminProductId, setAdminProductId] = useState(siteData.products[0]?.id);
  const [loggedIn, setLoggedIn] = useState(() => localStorage.getItem(ADMIN_SESSION_KEY) === "1");
  const [loginForm, setLoginForm] = useState({ username: "admin", password: "" });
  const [loginError, setLoginError] = useState("");
  const [authMode, setAuthMode] = useState(cloudEnabled ? "cloud" : "local");
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [savingCloud, setSavingCloud] = useState(false);
  const [categoryDraft, setCategoryDraft] = useState({ zh: "", en: "", key: "" });
  const importInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const text = adminUi[lang];
  const adminProduct =
    siteData.products.find((product) => product.id === adminProductId) || siteData.products[0];
  const categoryOptions = siteData.productCategories || [];

  useEffect(() => {
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
    document.title = lang === "zh" ? "上海恒猫机电后台管理" : "Shanghai Hengmao Admin";
  }, [lang]);

  useEffect(() => {
    if (!cloudEnabled) {
      return;
    }

    getCloudSession().then((session) => {
      if (session) {
        setLoggedIn(true);
        setAuthMode("cloud");
      }
    });
  }, []);

  useEffect(() => {
    if (!cloudEnabled || !hydrated || !loggedIn || authMode !== "cloud") {
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        setSavingCloud(true);
        await saveSiteContent(siteData);
      } finally {
        setSavingCloud(false);
      }
    }, 700);

    return () => window.clearTimeout(timer);
  }, [authMode, hydrated, loggedIn, siteData]);

  const login = async () => {
    if (authMode === "cloud" && cloudEnabled) {
      try {
        await cloudSignIn(loginForm.username, loginForm.password);
        setLoggedIn(true);
        setLoginError("");
        return;
      } catch (error) {
        setLoginError(
          error?.message ||
            (lang === "zh" ? "云端登录失败，请检查 Supabase 配置和账号。" : "Cloud login failed."),
        );
        return;
      }
    }

    if (loginForm.username === "admin" && loginForm.password === "admin123") {
      localStorage.setItem(ADMIN_SESSION_KEY, "1");
      setLoggedIn(true);
      setLoginError("");
      return;
    }

    setLoginError(
      lang === "zh"
        ? "账号或密码不正确。演示账号：admin / admin123"
        : "Invalid credentials. Demo account: admin / admin123",
    );
  };

  const logout = async () => {
    if (authMode === "cloud" && cloudEnabled) {
      await cloudSignOut();
    }
    localStorage.removeItem(ADMIN_SESSION_KEY);
    setLoggedIn(false);
    setLoginForm({ username: authMode === "cloud" ? "" : "admin", password: "" });
  };

  const updateBranding = (field, value) => {
    setSiteData((current) => ({
      ...current,
      branding: {
        ...current.branding,
        [field]: value,
      },
    }));
  };

  const updateContact = (field, value) => {
    setSiteData((current) => ({
      ...current,
      contact: {
        ...current.contact,
        [field]: value,
      },
    }));
  };

  const updateHome = (section, langKey, value) => {
    setSiteData((current) => ({
      ...current,
      home: {
        ...current.home,
        [section]: {
          ...current.home[section],
          [langKey]: value,
        },
      },
    }));
  };

  const updateStrength = (index, field, value) => {
    setSiteData((current) => ({
      ...current,
      home: {
        ...current.home,
        strengths: current.home.strengths.map((item, itemIndex) =>
          itemIndex === index ? { ...item, [field]: value } : item,
        ),
      },
    }));
  };

  const updateAbout = (section, langKey, value) => {
    setSiteData((current) => ({
      ...current,
      about: {
        ...current.about,
        [section]: {
          ...current.about[section],
          [langKey]: value,
        },
      },
    }));
  };

  const updateAboutPoint = (index, langKey, value) => {
    setSiteData((current) => ({
      ...current,
      about: {
        ...current.about,
        points: current.about.points.map((item, itemIndex) =>
          itemIndex === index ? { ...item, [langKey]: value } : item,
        ),
      },
    }));
  };

  const updateProduct = (productId, updater) => {
    setSiteData((current) => ({
      ...current,
      products: current.products.map((product) =>
        product.id === productId ? updater(product) : product,
      ),
    }));
  };

  const addProduct = () => {
    const nextProduct = createProductDraft(categoryOptions[0]?.key || "portable");
    setSiteData((current) => ({
      ...current,
      products: [nextProduct, ...current.products],
    }));
    setAdminProductId(nextProduct.id);
  };

  const updateCategory = (categoryKey, field, value) => {
    setSiteData((current) => ({
      ...current,
      productCategories: current.productCategories.map((category) =>
        category.key === categoryKey ? { ...category, [field]: value } : category,
      ),
    }));
  };

  const addCategory = () => {
    const nextKey = slugifyCategoryKey(categoryDraft.key || categoryDraft.en || categoryDraft.zh);
    if (!nextKey || !categoryDraft.zh.trim() || !categoryDraft.en.trim()) {
      return;
    }
    if (categoryOptions.some((item) => item.key === nextKey)) {
      window.alert(lang === "zh" ? "分类代码已存在，请换一个。" : "Category key already exists.");
      return;
    }

    setSiteData((current) => ({
      ...current,
      productCategories: [
        ...current.productCategories,
        {
          key: nextKey,
          zh: categoryDraft.zh.trim(),
          en: categoryDraft.en.trim(),
        },
      ],
    }));
    setCategoryDraft({ zh: "", en: "", key: "" });
  };

  const removeCategory = (categoryKey) => {
    if (categoryOptions.length <= 1) {
      return;
    }

    const fallbackCategory = categoryOptions.find((item) => item.key !== categoryKey);
    if (!fallbackCategory) {
      return;
    }

    setSiteData((current) => ({
      ...current,
      productCategories: current.productCategories.filter((category) => category.key !== categoryKey),
      products: current.products.map((product) =>
        product.type === categoryKey ? { ...product, type: fallbackCategory.key } : product,
      ),
    }));
  };

  const deleteProduct = () => {
    if (siteData.products.length <= 1) {
      return;
    }
    const nextProducts = siteData.products.filter((product) => product.id !== adminProductId);
    setSiteData((current) => ({
      ...current,
      products: nextProducts,
    }));
    setAdminProductId(nextProducts[0].id);
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(siteData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "hengmao-site-config.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const importData = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const textContent = await file.text();
    try {
      const parsed = JSON.parse(textContent);
      setSiteData(parsed);
      if (parsed.products?.[0]?.id) {
        setAdminProductId(parsed.products[0].id);
      }
    } catch {
      window.alert("导入失败，请检查 JSON 文件格式。");
    }
    event.target.value = "";
  };

  const toDataUrls = async (files) => {
    return Promise.all(
      files.map(
        (file) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          }),
      ),
    );
  };

  const handleImageUpload = async (files) => {
    if (!files.length || !adminProduct) {
      return;
    }

    setUploadingImages(true);
    try {
      const uploadedImages =
        authMode === "cloud" && cloudEnabled
          ? await uploadImagesToCloud(files)
          : await toDataUrls(files);

      updateProduct(adminProduct.id, (product) => ({
        ...product,
        images: [...product.images, ...uploadedImages],
      }));
    } finally {
      setUploadingImages(false);
    }
  };

  const handleVideoUpload = async (files) => {
    if (!files.length || !adminProduct) {
      return;
    }

    if (!(authMode === "cloud" && cloudEnabled)) {
      window.alert(
        lang === "zh"
          ? "本地演示模式不能直接保存视频文件。请先配置 Supabase 云端存储，或把视频上传到云盘/对象存储后填写可直接播放的视频链接。"
          : "Local demo mode cannot save video files. Configure Supabase cloud storage, or paste a direct playable video URL.",
      );
      return;
    }

    setUploadingVideo(true);
    try {
      const uploadedVideos = await uploadVideosToCloud(files);

      updateProduct(adminProduct.id, (product) => ({
        ...product,
        video: uploadedVideos[0] || product.video,
      }));
    } finally {
      setUploadingVideo(false);
    }
  };

  const setAsMainImage = (indexToPromote) => {
    updateProduct(adminProduct.id, (product) => {
      const nextImages = [...product.images];
      const [target] = nextImages.splice(indexToPromote, 1);
      nextImages.unshift(target);
      return { ...product, images: nextImages };
    });
  };

  const moveImage = (indexToMove, direction) => {
    updateProduct(adminProduct.id, (product) => {
      const nextIndex = indexToMove + direction;
      if (nextIndex < 0 || nextIndex >= product.images.length) {
        return product;
      }
      const nextImages = [...product.images];
      [nextImages[indexToMove], nextImages[nextIndex]] = [
        nextImages[nextIndex],
        nextImages[indexToMove],
      ];
      return { ...product, images: nextImages };
    });
  };

  const removeImage = (indexToRemove) => {
    updateProduct(adminProduct.id, (product) => ({
      ...product,
      images: product.images.filter((_, index) => index !== indexToRemove),
    }));
  };

  if (!loggedIn) {
    return (
      <div className="site-shell admin-login-shell">
        <div className="admin-login-card">
          <div className="brand admin-login-brand">
            <span className="brand-mark">HM</span>
            <span>
              <strong>{lang === "zh" ? "管理后台登录" : "Admin Login"}</strong>
              <small>
                {authMode === "cloud" && cloudEnabled
                  ? lang === "zh"
                    ? "Supabase 云端登录已启用"
                    : "Supabase cloud auth enabled"
                  : lang === "zh"
                    ? "演示账号：admin / admin123"
                    : "Demo account: admin / admin123"}
              </small>
            </span>
          </div>

          <div className="admin-login-form">
            {cloudEnabled ? (
              <div className="auth-mode-switch">
                <button className={authMode === "cloud" ? "tab active" : "tab"} onClick={() => setAuthMode("cloud")}>
                  {lang === "zh" ? "云端账号" : "Cloud Auth"}
                </button>
                <button className={authMode === "local" ? "tab active" : "tab"} onClick={() => setAuthMode("local")}>
                  {lang === "zh" ? "本地演示" : "Local Demo"}
                </button>
              </div>
            ) : null}

            <label className="admin-field">
              <span>{authMode === "cloud" ? (lang === "zh" ? "邮箱" : "Email") : lang === "zh" ? "账号" : "Username"}</span>
              <input
                value={loginForm.username}
                onChange={(event) => setLoginForm((current) => ({ ...current, username: event.target.value }))}
              />
            </label>

            <label className="admin-field">
              <span>{lang === "zh" ? "密码" : "Password"}</span>
              <input
                type="password"
                value={loginForm.password}
                onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    login();
                  }
                }}
              />
            </label>

            {loginError ? <div className="login-error">{loginError}</div> : null}

            <div className="admin-login-actions">
              <button className="primary-btn" onClick={login}>
                {lang === "zh" ? "登录后台" : "Sign In"}
              </button>
              <button className="secondary-btn" onClick={() => setLang(lang === "zh" ? "en" : "zh")}>
                {text.switchLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!adminProduct) {
    return null;
  }

  return (
    <div className="site-shell">
      <header className="topbar">
        <button className="brand" onClick={() => window.location.assign("/")}>
          <span className="brand-mark">HM</span>
          <span>
            <strong>{text.admin}</strong>
            <small>{lang === "zh" ? siteData.branding.zhName : siteData.branding.enName}</small>
          </span>
        </button>

        <div className="topbar-right">
          <nav className="nav">
            <button onClick={() => window.location.assign("/")}>{text.viewPublic}</button>
            <button onClick={logout}>{lang === "zh" ? "退出登录" : "Logout"}</button>
          </nav>
          <button className="lang-switch" onClick={() => setLang(lang === "zh" ? "en" : "zh")}>
            {text.switchLabel}
          </button>
        </div>
      </header>

      <main className="page admin-page">
        <div className="section-heading compact">
          <p className="eyebrow">{text.admin}</p>
          <h1>{text.adminTitle}</h1>
          <p>{text.adminDesc}</p>
        </div>

        <section className="admin-layout">
          <aside className="admin-sidebar card">
            {["site", "home", "about", "products", "contact", "tools"].map((tabKey) => (
              <button
                key={tabKey}
                className={adminTab === tabKey ? "admin-nav active" : "admin-nav"}
                onClick={() => setAdminTab(tabKey)}
              >
                <span className="admin-nav-icon">{adminIcons[tabKey]}</span>
                <span>{text[`admin${tabKey.charAt(0).toUpperCase()}${tabKey.slice(1)}`]}</span>
              </button>
            ))}
            <div className="admin-save-state">
              {savingCloud
                ? lang === "zh"
                  ? "正在同步云端..."
                  : "Syncing to cloud..."
                : text.saveState}
            </div>
          </aside>

          <div className="admin-main">
            {adminTab === "site" && (
              <div className="admin-card-grid">
                <article className="card">
                  <h3>{text.adminSite}</h3>
                  <AdminField label={text.formZhName} value={siteData.branding.zhName} onChange={(value) => updateBranding("zhName", value)} />
                  <AdminField label={text.formEnName} value={siteData.branding.enName} onChange={(value) => updateBranding("enName", value)} />
                  <AdminField label={text.formZhSub} value={siteData.branding.zhSub} onChange={(value) => updateBranding("zhSub", value)} />
                  <AdminField label={text.formEnSub} value={siteData.branding.enSub} onChange={(value) => updateBranding("enSub", value)} />
                </article>
              </div>
            )}

            {adminTab === "home" && (
              <div className="admin-card-grid">
                <article className="card">
                  <h3>{text.adminHome}</h3>
                  <AdminField label={`${text.heroTag} / 中文`} value={siteData.home.heroTag.zh} onChange={(value) => updateHome("heroTag", "zh", value)} />
                  <AdminField label={`${text.heroTag} / English`} value={siteData.home.heroTag.en} onChange={(value) => updateHome("heroTag", "en", value)} />
                  <AdminField label={`${text.heroTitle} / 中文`} value={siteData.home.heroTitle.zh} onChange={(value) => updateHome("heroTitle", "zh", value)} />
                  <AdminField label={`${text.heroTitle} / English`} value={siteData.home.heroTitle.en} onChange={(value) => updateHome("heroTitle", "en", value)} />
                  <AdminTextarea label={`${text.heroDesc} / 中文`} value={siteData.home.heroDesc.zh} onChange={(value) => updateHome("heroDesc", "zh", value)} />
                  <AdminTextarea label={`${text.heroDesc} / English`} value={siteData.home.heroDesc.en} onChange={(value) => updateHome("heroDesc", "en", value)} />
                </article>

                {siteData.home.strengths.map((item, index) => (
                  <article className="card" key={`${item.zhTitle}-${index}`}>
                    <h3>{`${text.adminHome} ${index + 1}`}</h3>
                    <AdminField label={text.zhTitle} value={item.zhTitle} onChange={(value) => updateStrength(index, "zhTitle", value)} />
                    <AdminField label={text.enTitle} value={item.enTitle} onChange={(value) => updateStrength(index, "enTitle", value)} />
                    <AdminTextarea label={text.zhText} value={item.zhText} onChange={(value) => updateStrength(index, "zhText", value)} />
                    <AdminTextarea label={text.enText} value={item.enText} onChange={(value) => updateStrength(index, "enText", value)} />
                  </article>
                ))}
              </div>
            )}

            {adminTab === "about" && (
              <div className="admin-card-grid">
                <article className="card">
                  <h3>{text.adminAbout}</h3>
                  <AdminField label={text.zhTitle} value={siteData.about.title.zh} onChange={(value) => updateAbout("title", "zh", value)} />
                  <AdminField label={text.enTitle} value={siteData.about.title.en} onChange={(value) => updateAbout("title", "en", value)} />
                  <AdminTextarea label={text.zhText} value={siteData.about.body.zh} onChange={(value) => updateAbout("body", "zh", value)} />
                  <AdminTextarea label={text.enText} value={siteData.about.body.en} onChange={(value) => updateAbout("body", "en", value)} />
                </article>

                {siteData.about.points.map((item, index) => (
                  <article className="card" key={`${item.zh}-${index}`}>
                    <h3>{`Point ${index + 1}`}</h3>
                    <AdminField label={text.zhText} value={item.zh} onChange={(value) => updateAboutPoint(index, "zh", value)} />
                    <AdminField label={text.enText} value={item.en} onChange={(value) => updateAboutPoint(index, "en", value)} />
                  </article>
                ))}
              </div>
            )}

            {adminTab === "products" && (
              <div className="admin-products-layout">
                <article className="card admin-category-panel">
                  <div className="admin-list-head">
                    <h3>{lang === "zh" ? "产品分类管理" : "Category Manager"}</h3>
                    <button className="secondary-btn small-btn" onClick={addCategory}>
                      {lang === "zh" ? "新增分类" : "Add Category"}
                    </button>
                  </div>

                  <div className="admin-category-compact">
                    <div className="admin-category-compact-form">
                      <AdminField
                        label={lang === "zh" ? "分类名称 / 中文" : "Category Name / Chinese"}
                        value={categoryDraft.zh}
                        onChange={(value) => setCategoryDraft((current) => ({ ...current, zh: value }))}
                      />
                      <AdminField
                        label={lang === "zh" ? "分类名称 / 英文" : "Category Name / English"}
                        value={categoryDraft.en}
                        onChange={(value) => setCategoryDraft((current) => ({ ...current, en: value }))}
                      />
                      <AdminField
                        label={lang === "zh" ? "分类代码" : "Category Key"}
                        value={categoryDraft.key}
                        onChange={(value) => setCategoryDraft((current) => ({ ...current, key: value }))}
                      />
                    </div>

                    <div className="admin-category-pill-list">
                      {categoryOptions.map((category) => (
                        <div key={category.key} className="admin-category-pill">
                          <div className="admin-category-pill-copy">
                            <strong>{category[lang]}</strong>
                            <span>{category.key}</span>
                          </div>
                          <button className="text-btn" onClick={() => removeCategory(category.key)}>
                            {lang === "zh" ? "删除" : "Remove"}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </article>

                <article className="card admin-product-editor">
                  <div className="admin-list-head">
                    <h3>{text.productEditor}</h3>
                    <div className="admin-tools-row admin-list-actions">
                      <button className="primary-btn small-btn" onClick={addProduct}>
                        {text.addProduct}
                      </button>
                      <button className="secondary-btn small-btn" onClick={deleteProduct}>
                        {text.deleteProduct}
                      </button>
                    </div>
                  </div>

                  <div className="admin-product-items admin-product-items-inline">
                    {siteData.products.map((product) => (
                      <button
                        key={product.id}
                        className={adminProductId === product.id ? "admin-product-item active" : "admin-product-item"}
                        onClick={() => setAdminProductId(product.id)}
                      >
                        <img src={product.images[0]} alt="" />
                        <div>
                          <strong>{product.model}</strong>
                          <span>{product.name[lang]}</span>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="form-grid two-col">
                    <AdminSelect
                      label={text.category}
                      value={adminProduct.type}
                      options={categoryOptions.map((option) => ({
                        value: option.key,
                        label: option[lang],
                      }))}
                      onChange={(value) => updateProduct(adminProduct.id, (product) => ({ ...product, type: value }))}
                    />
                    <AdminField label={text.model} value={adminProduct.model} onChange={(value) => updateProduct(adminProduct.id, (product) => ({ ...product, model: value }))} />
                    <AdminField
                      label={lang === "zh" ? "产品价格（人民币）" : "Base Price (RMB)"}
                      helper={lang === "zh" ? "前台中文显示 RMB，英文会自动换算成 USD。" : "Stored in RMB. The English site converts it to USD automatically."}
                      value={adminProduct.price}
                      onChange={(value) => updateProduct(adminProduct.id, (product) => ({ ...product, price: value }))}
                    />
                    <div className="admin-note">{text.uploadTip}</div>
                  </div>

                  <div className="form-grid two-col">
                    <AdminField label={text.formZhName} value={adminProduct.name.zh} onChange={(value) => updateProduct(adminProduct.id, (product) => ({ ...product, name: { ...product.name, zh: value } }))} />
                    <AdminField label={text.formEnName} value={adminProduct.name.en} onChange={(value) => updateProduct(adminProduct.id, (product) => ({ ...product, name: { ...product.name, en: value } }))} />
                    <AdminTextarea label={`${text.shortDesc} / 中文`} value={adminProduct.short.zh} onChange={(value) => updateProduct(adminProduct.id, (product) => ({ ...product, short: { ...product.short, zh: value } }))} />
                    <AdminTextarea label={`${text.shortDesc} / English`} value={adminProduct.short.en} onChange={(value) => updateProduct(adminProduct.id, (product) => ({ ...product, short: { ...product.short, en: value } }))} />
                  </div>

                  <div className="form-grid two-col">
                    <AdminTextarea label={`${text.intro} / 中文`} value={adminProduct.intro.zh} onChange={(value) => updateProduct(adminProduct.id, (product) => ({ ...product, intro: { ...product.intro, zh: value } }))} />
                    <AdminTextarea label={`${text.intro} / English`} value={adminProduct.intro.en} onChange={(value) => updateProduct(adminProduct.id, (product) => ({ ...product, intro: { ...product.intro, en: value } }))} />
                  </div>

                  <div className="form-grid two-col">
                    <AdminTextarea label={`${text.features} / 中文`} helper={text.featureTip} value={adminProduct.features.zh.join("\n")} onChange={(value) => updateProduct(adminProduct.id, (product) => ({ ...product, features: { ...product.features, zh: parseLines(value) } }))} />
                    <AdminTextarea label={`${text.features} / English`} helper={text.featureTip} value={adminProduct.features.en.join("\n")} onChange={(value) => updateProduct(adminProduct.id, (product) => ({ ...product, features: { ...product.features, en: parseLines(value) } }))} />
                  </div>

                  <div className="form-grid two-col">
                    <AdminTextarea label={text.specs} helper={text.specTip} value={adminProduct.specs.map((item) => `${item.label}: ${item.value}`).join("\n")} onChange={(value) => updateProduct(adminProduct.id, (product) => ({ ...product, specs: parseSpecs(value) }))} />
                    <AdminTextarea label={text.images} helper={text.imageTip} value={adminProduct.images.join("\n")} onChange={(value) => updateProduct(adminProduct.id, (product) => ({ ...product, images: parseLines(value) }))} />
                  </div>

                  <div className="admin-upload-strip admin-tools-row">
                    <button className="secondary-btn small-btn" onClick={() => imageInputRef.current?.click()}>
                      {uploadingImages ? (lang === "zh" ? "图片上传中..." : "Uploading images...") : lang === "zh" ? "上传图片" : "Upload Images"}
                    </button>
                    <input
                      ref={imageInputRef}
                      className="hidden-input"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(event) => {
                        handleImageUpload(Array.from(event.target.files || []));
                        event.target.value = "";
                      }}
                    />

                    <button className="secondary-btn small-btn" onClick={() => videoInputRef.current?.click()}>
                      {uploadingVideo ? (lang === "zh" ? "视频上传中..." : "Uploading video...") : lang === "zh" ? "上传视频" : "Upload Video"}
                    </button>
                    <input
                      ref={videoInputRef}
                      className="hidden-input"
                      type="file"
                      accept="video/*"
                      onChange={(event) => {
                        handleVideoUpload(Array.from(event.target.files || []));
                        event.target.value = "";
                      }}
                    />
                  </div>

                  <div className="admin-image-gallery">
                    {adminProduct.images.map((image, index) => (
                      <div key={`${image}-${index}`} className="admin-image-card">
                        <img src={image} alt="" />
                        <div className="admin-image-actions">
                          <button className="text-btn" onClick={() => setAsMainImage(index)}>
                            {index === 0 ? (lang === "zh" ? "当前主图" : "Main Image") : lang === "zh" ? "设为主图" : "Set Main"}
                          </button>
                          <button className="text-btn" onClick={() => moveImage(index, -1)}>
                            {lang === "zh" ? "上移" : "Up"}
                          </button>
                          <button className="text-btn" onClick={() => moveImage(index, 1)}>
                            {lang === "zh" ? "下移" : "Down"}
                          </button>
                          <button className="text-btn" onClick={() => removeImage(index)}>
                            {lang === "zh" ? "删除" : "Remove"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <AdminField label={text.video} helper={text.videoTip} value={adminProduct.video} onChange={(value) => updateProduct(adminProduct.id, (product) => ({ ...product, video: value }))} />
                  <video className="video-player admin-video-preview" controls src={adminProduct.video} />

                  <div className="card admin-preview-card">
                    <h3>{text.livePreview}</h3>
                    <div className="admin-preview">
                      <img src={adminProduct.images[0]} alt="" />
                      <div>
                        <p>{adminProduct.model}</p>
                        <h4>{adminProduct.name[lang]}</h4>
                        <strong>{adminProduct.price}</strong>
                      </div>
                    </div>
                  </div>
                </article>
              </div>
            )}

            {adminTab === "contact" && (
              <div className="admin-card-grid">
                <article className="card">
                  <h3>{text.adminContact}</h3>
                  <AdminField label="Email" value={siteData.contact.email} onChange={(value) => updateContact("email", value)} />
                  <AdminField label="Phone / WhatsApp" value={siteData.contact.phone} onChange={(value) => updateContact("phone", value)} />
                  <AdminField label="地址 / 中文" value={siteData.contact.addressZh} onChange={(value) => updateContact("addressZh", value)} />
                  <AdminField label="Address / English" value={siteData.contact.addressEn} onChange={(value) => updateContact("addressEn", value)} />
                  <AdminTextarea label={text.descZh} value={siteData.contact.descZh} onChange={(value) => updateContact("descZh", value)} />
                  <AdminTextarea label={text.descEn} value={siteData.contact.descEn} onChange={(value) => updateContact("descEn", value)} />
                </article>
              </div>
            )}

            {adminTab === "tools" && (
              <div className="admin-card-grid">
                <article className="card">
                  <h3>{text.adminTools}</h3>
                  <p>{text.uploadTip}</p>
                  <div className="admin-tools-row">
                    <button className="primary-btn small-btn" onClick={exportData}>
                      {text.exportData}
                    </button>
                    <button className="secondary-btn small-btn" onClick={() => importInputRef.current?.click()}>
                      {text.importData}
                    </button>
                    <button className="secondary-btn small-btn" onClick={resetData}>
                      {text.resetData}
                    </button>
                  </div>
                  <input
                    ref={importInputRef}
                    type="file"
                    accept="application/json"
                    className="hidden-input"
                    onChange={importData}
                  />
                  <div className="admin-note">
                    {cloudEnabled
                      ? lang === "zh"
                        ? "当前已检测到 Supabase 配置。前台会优先读取云端配置，后台会自动同步到云端。"
                        : "Supabase configuration detected. The public site reads cloud content and the admin syncs changes to cloud."
                      : lang === "zh"
                        ? "当前为本地模式。配置 .env 中的 Supabase 参数后即可切换到正式云端账号系统。"
                        : "Local mode is active. Add Supabase environment variables to enable real cloud auth and uploads."}
                  </div>
                </article>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function publicLabel(key, lang) {
  const labels = {
    zh: {
      portable: "手提式洗车机",
      trolley: "推车款洗车机",
      waterGun: "水枪",
      highPressureHose: "高压管",
      steelWireHose: "钢丝管",
    },
    en: {
      portable: "Portable Washers",
      trolley: "Trolley Washers",
      waterGun: "Water Guns",
      highPressureHose: "High Pressure Hoses",
      steelWireHose: "Steel Wire Hoses",
    },
  };

  return labels[lang][key];
}

function AdminField({ label, value, onChange, helper }) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} />
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
