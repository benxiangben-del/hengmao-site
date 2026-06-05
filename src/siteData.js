import { useEffect, useState } from "react";
import { cloudEnabled, fetchSiteContent } from "./cloud.js";

export const STORAGE_KEY = "hengmao-site-admin-data-v1";

export const defaultSiteData = {
  branding: {
    zhName: "上海恒猫机电",
    enName: "Shanghai Hengmao Machinery",
    zhSub: "洗车机与高压清洁配件供应商",
    enSub: "Car Washer and High Pressure Cleaning Accessories Supplier",
  },
  home: {
    heroTag: {
      zh: "专注手提式与推车款洗车机",
      en: "Portable washers, trolley washers, and accessories",
    },
    heroTitle: {
      zh: "黑色高级感洗车机官网",
      en: "A premium black website for car washer products",
    },
    heroDesc: {
      zh: "上海恒猫机电主营手提式洗车机、推车款洗车机，以及水枪、高压管、钢丝管等配件，支持产品详情与安装视频查看。",
      en: "Shanghai Hengmao Machinery focuses on portable car washers, trolley washers, water guns, high pressure hoses, and steel wire hoses with product detail pages and installation video search.",
    },
    strengths: [
      {
        zhTitle: "洗车机主营方向清晰",
        enTitle: "Focused product range",
        zhText: "包含手提式、推车款及常用配件产品线。",
        enText: "Portable washers, trolley washers, and key accessories are clearly separated.",
      },
      {
        zhTitle: "产品页面结构完整",
        enTitle: "Complete detail pages",
        zhText: "列表、详情、参数表、多图轮播和安装视频一页可见。",
        enText: "Gallery, parameter table, product introduction, and installation video are available together.",
      },
      {
        zhTitle: "帮助页面支持型号搜索",
        enTitle: "Support model search",
        zhText: "可以按产品型号快速定位对应的安装视频。",
        enText: "Users can search by model number to find the matching installation video quickly.",
      },
    ],
  },
  about: {
    title: {
      zh: "公司介绍",
      en: "Company Introduction",
    },
    body: {
      zh: "上海恒猫机电专注于洗车机及清洁配件的展示与供应，主要产品包括手提式洗车机、推车款洗车机、水枪、高压管和钢丝管等。我们重视产品结构实用性、配件适配性以及使用便捷性。",
      en: "Shanghai Hengmao Machinery focuses on product display and supply for car washers and cleaning accessories. Main products include portable car washers, trolley car washers, water guns, high pressure hoses, and steel wire hoses.",
    },
    points: [
      {
        zh: "主营整机与配件一体化展示",
        en: "Integrated display for machines and accessories",
      },
      {
        zh: "支持多类型产品分类浏览",
        en: "Five major product categories",
      },
      {
        zh: "支持按型号搜索安装视频",
        en: "Model-based installation video search",
      },
    ],
  },
  contact: {
    email: "sales@hengmao.com",
    phone: "+86-000-0000-0000",
    addressZh: "中国上海",
    addressEn: "Shanghai, China",
    descZh: "欢迎联系上海恒猫机电获取产品资料和报价支持。",
    descEn: "Contact Shanghai Hengmao Machinery for product materials and quotations.",
  },
  productCategories: [
    { key: "portable", zh: "手提式洗车机", en: "Portable Washers" },
    { key: "trolley", zh: "推车款洗车机", en: "Trolley Washers" },
    { key: "water-gun", zh: "水枪", en: "Water Guns" },
    { key: "high-pressure-hose", zh: "高压管", en: "High Pressure Hoses" },
    { key: "steel-wire-hose", zh: "钢丝管", en: "Steel Wire Hoses" },
  ],
  products: [
    {
      id: "hm-p1200",
      type: "portable",
      model: "HM-P1200",
      price: "$129",
      name: {
        zh: "手提式洗车机 HM-P1200",
        en: "Portable Car Washer HM-P1200",
      },
      short: {
        zh: "轻巧便携，适合家用洗车、庭院冲洗和户外清洁。",
        en: "Portable for home car washing, yard rinsing, and outdoor cleaning.",
      },
      intro: {
        zh: "HM-P1200 采用紧凑便携结构，安装简单，移动方便，可满足家用洗车、地面冲洗及工具清洁需求。",
        en: "HM-P1200 uses a compact portable structure for easy setup and movement. It suits home car washing, floor rinsing, and general cleaning tasks.",
      },
      features: {
        zh: ["便携式机身", "安装快速", "出水压力稳定", "适合家用与户外场景"],
        en: ["Portable body", "Quick installation", "Stable pressure", "Home and outdoor use"],
      },
      specs: [
        { label: "Power", value: "1200W" },
        { label: "Pressure", value: "80-120 Bar" },
        { label: "Flow", value: "6 L/min" },
        { label: "Voltage", value: "220V / 50Hz" },
      ],
      images: [
        "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=1400&q=80",
        "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=1400&q=80",
        "https://images.unsplash.com/photo-1608506375591-b90e1f955e4b?auto=format&fit=crop&w=1400&q=80",
      ],
      video: "https://www.w3schools.com/html/mov_bbb.mp4",
    },
    {
      id: "hm-t1800",
      type: "trolley",
      model: "HM-T1800",
      price: "$239",
      name: {
        zh: "推车款洗车机 HM-T1800",
        en: "Trolley Car Washer HM-T1800",
      },
      short: {
        zh: "推车式高压输出，适合高频次清洁作业。",
        en: "Trolley-style washer for frequent and longer cleaning work.",
      },
      intro: {
        zh: "HM-T1800 配有手推车架和滚轮，移动更方便，适合洗车店、工厂及物业清洁等场景。",
        en: "HM-T1800 comes with a trolley frame and wheels for easier movement. It is suitable for car wash shops, factories, and property cleaning applications.",
      },
      features: {
        zh: ["推车式结构", "高压输出", "耐用泵体", "便于配件收纳"],
        en: ["Trolley frame", "High pressure output", "Durable pump", "Easy accessory storage"],
      },
      specs: [
        { label: "Power", value: "1800W" },
        { label: "Pressure", value: "100-150 Bar" },
        { label: "Flow", value: "7 L/min" },
        { label: "Voltage", value: "220V / 50Hz" },
      ],
      images: [
        "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=1400&q=80",
        "https://images.unsplash.com/photo-1504222490345-c075b6008014?auto=format&fit=crop&w=1400&q=80",
        "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=1400&q=80",
      ],
      video: "https://www.w3schools.com/html/movie.mp4",
    },
    {
      id: "hm-g01",
      type: "water-gun",
      model: "HM-G01",
      price: "$39",
      name: {
        zh: "水枪 HM-G01",
        en: "Water Gun HM-G01",
      },
      short: {
        zh: "握持舒适，连接快捷，适配多种洗车机。",
        en: "Comfortable grip with quick connection for multiple washer models.",
      },
      intro: {
        zh: "HM-G01 水枪采用人体工学握把设计，喷射稳定，可用于日常洗车及一般冲洗作业。",
        en: "HM-G01 uses an ergonomic handle and stable spray output for daily car washing and general rinsing jobs.",
      },
      features: {
        zh: ["舒适握把", "快速接头", "喷射稳定", "适配多种机型"],
        en: ["Comfortable grip", "Quick connector", "Stable spray", "Multi-model compatibility"],
      },
      specs: [
        { label: "Material", value: "Engineering plastic + brass" },
        { label: "Pressure", value: "Up to 160 Bar" },
        { label: "Connection", value: "Quick coupling" },
      ],
      images: [
        "https://images.unsplash.com/photo-1610632380989-680fe40816c6?auto=format&fit=crop&w=1400&q=80",
        "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=1400&q=80",
        "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1400&q=80",
      ],
      video: "https://www.w3schools.com/html/mov_bbb.mp4",
    },
    {
      id: "hm-h10",
      type: "high-pressure-hose",
      model: "HM-H10",
      price: "$24",
      name: {
        zh: "高压管 HM-H10",
        en: "High Pressure Hose HM-H10",
      },
      short: {
        zh: "柔韧耐压，适用于洗车机主机与水枪连接。",
        en: "Flexible and pressure-resistant for washer-to-gun connection.",
      },
      intro: {
        zh: "HM-H10 高压管适用于洗车机主机与水枪之间的高压输水连接，具备良好的耐压性和柔韧性。",
        en: "HM-H10 is designed for high-pressure water transfer between the washer unit and spray gun with reliable flexibility and pressure resistance.",
      },
      features: {
        zh: ["柔韧易弯曲", "耐压耐用", "连接稳定", "适合常规洗车作业"],
        en: ["Flexible bend radius", "Pressure resistant", "Stable connection", "Suitable for regular washing work"],
      },
      specs: [
        { label: "Length", value: "10m / Custom" },
        { label: "Pressure", value: "Up to 180 Bar" },
        { label: "Material", value: "Reinforced hose" },
      ],
      images: [
        "https://images.unsplash.com/photo-1590669148919-4f9935b4414f?auto=format&fit=crop&w=1400&q=80",
        "https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?auto=format&fit=crop&w=1400&q=80",
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80",
      ],
      video: "https://www.w3schools.com/html/movie.mp4",
    },
    {
      id: "hm-h10s",
      type: "steel-wire-hose",
      model: "HM-H10S",
      price: "$32",
      name: {
        zh: "钢丝管 HM-H10S",
        en: "Steel Wire Hose HM-H10S",
      },
      short: {
        zh: "钢丝增强层结构，更适合高强度清洁使用。",
        en: "Steel-wire reinforced hose for stronger and heavier-duty cleaning work.",
      },
      intro: {
        zh: "HM-H10S 钢丝管具有更强的耐压性和耐磨性，适合长时间、高强度洗车与冲洗工况。",
        en: "HM-H10S offers stronger pressure resistance and abrasion resistance for long-duration and heavy-duty washing conditions.",
      },
      features: {
        zh: ["钢丝增强层", "耐压耐磨", "适合长时间使用", "长度可定制"],
        en: ["Steel-wire reinforcement", "Wear and pressure resistant", "Long-duration use", "Custom lengths available"],
      },
      specs: [
        { label: "Length", value: "10m / Custom" },
        { label: "Pressure", value: "Up to 200 Bar" },
        { label: "Layer", value: "Steel wire reinforced" },
      ],
      images: [
        "https://images.unsplash.com/photo-1590669148919-4f9935b4414f?auto=format&fit=crop&w=1400&q=80",
        "https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?auto=format&fit=crop&w=1400&q=80",
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80",
      ],
      video: "https://www.w3schools.com/html/mov_bbb.mp4",
    },
  ],
};

function normalizeSiteData(nextData) {
  if (!nextData) {
    return defaultSiteData;
  }

  return {
    ...defaultSiteData,
    ...nextData,
    branding: {
      ...defaultSiteData.branding,
      ...nextData.branding,
    },
    home: {
      ...defaultSiteData.home,
      ...nextData.home,
      heroTag: {
        ...defaultSiteData.home.heroTag,
        ...nextData.home?.heroTag,
      },
      heroTitle: {
        ...defaultSiteData.home.heroTitle,
        ...nextData.home?.heroTitle,
      },
      heroDesc: {
        ...defaultSiteData.home.heroDesc,
        ...nextData.home?.heroDesc,
      },
      strengths: nextData.home?.strengths || defaultSiteData.home.strengths,
    },
    about: {
      ...defaultSiteData.about,
      ...nextData.about,
      title: {
        ...defaultSiteData.about.title,
        ...nextData.about?.title,
      },
      body: {
        ...defaultSiteData.about.body,
        ...nextData.about?.body,
      },
      points: nextData.about?.points || defaultSiteData.about.points,
    },
    contact: {
      ...defaultSiteData.contact,
      ...nextData.contact,
    },
    productCategories:
      nextData.productCategories && nextData.productCategories.length > 0
        ? nextData.productCategories
        : defaultSiteData.productCategories,
    products: nextData.products || defaultSiteData.products,
  };
}

export const publicUi = {
  zh: {
    home: "首页",
    about: "公司介绍",
    products: "产品中心",
    support: "帮助",
    contact: "联系我们",
    switchLabel: "English",
    featured: "产品展示",
    featuredDesc: "点击产品图即可进入详情页，查看多图、参数、介绍与安装视频。",
    productCenterTitle: "产品中心",
    productCenterDesc: "按类型查看产品，点击即可进入详情页。",
    all: "全部",
    portable: "手提式洗车机",
    trolley: "推车款洗车机",
    waterGun: "水枪",
    highPressureHose: "高压管",
    steelWireHose: "钢丝管",
    detail: "查看详情",
    detailIntroTitle: "产品介绍",
    detailFeatureTitle: "产品特点",
    detailSpecTitle: "参数表",
    detailVideoTitle: "安装视频",
    priceLabel: "参考价格",
    backToProducts: "返回产品中心",
    searchTitle: "帮助页面型号搜索",
    searchDesc: "输入产品型号，快速找到对应产品和安装视频。",
    searchPlaceholder: "例如：HM-P1200",
    searchEmpty: "未找到对应产品，请检查型号。",
    searchResult: "搜索结果",
    watchVideo: "查看安装视频",
    contactTitle: "联系我们",
    footer: "上海恒猫机电",
  },
  en: {
    home: "Home",
    about: "About",
    products: "Products",
    support: "Support",
    contact: "Contact",
    switchLabel: "中文",
    featured: "Featured Products",
    featuredDesc: "Click any product card to open the detail page with gallery, specs, text, and video.",
    productCenterTitle: "Product Center",
    productCenterDesc: "Browse products by category and open the detail page.",
    all: "All",
    portable: "Portable Washers",
    trolley: "Trolley Washers",
    waterGun: "Water Guns",
    highPressureHose: "High Pressure Hoses",
    steelWireHose: "Steel Wire Hoses",
    detail: "View Details",
    detailIntroTitle: "Introduction",
    detailFeatureTitle: "Features",
    detailSpecTitle: "Specifications",
    detailVideoTitle: "Installation Video",
    priceLabel: "Price",
    backToProducts: "Back to Products",
    searchTitle: "Support Video Search",
    searchDesc: "Enter a product model number to locate the matching product and installation video.",
    searchPlaceholder: "Example: HM-P1200",
    searchEmpty: "No matching product was found.",
    searchResult: "Results",
    watchVideo: "Watch Video",
    contactTitle: "Contact Us",
    footer: "Shanghai Hengmao Machinery",
  },
};

export const adminUi = {
  zh: {
    admin: "管理后台",
    switchLabel: "English",
    adminTitle: "网站可视化管理平台",
    adminDesc: "所有修改都会自动保存到当前浏览器，并立即同步到用户访问版。",
    adminSite: "站点设置",
    adminHome: "首页内容",
    adminAbout: "公司介绍",
    adminProducts: "产品管理",
    adminContact: "联系信息",
    adminTools: "数据工具",
    saveState: "自动保存中",
    exportData: "导出配置",
    importData: "导入配置",
    resetData: "恢复默认",
    addProduct: "新增产品",
    deleteProduct: "删除当前产品",
    formZhName: "中文名称",
    formEnName: "英文名称",
    formZhSub: "中文副标题",
    formEnSub: "英文副标题",
    heroTag: "首页标签",
    heroTitle: "首页主标题",
    heroDesc: "首页说明",
    zhTitle: "中文标题",
    enTitle: "英文标题",
    zhText: "中文内容",
    enText: "英文内容",
    descZh: "中文说明",
    descEn: "英文说明",
    productList: "产品列表",
    productEditor: "产品编辑",
    category: "产品分类",
    model: "产品型号",
    price: "价格",
    shortDesc: "卡片简介",
    intro: "产品介绍",
    features: "产品特点",
    specs: "参数表",
    images: "产品图片",
    video: "安装视频",
    imageTip: "每行一个图片地址",
    featureTip: "每行一个特点",
    specTip: "每行使用“名称: 值”的格式",
    videoTip: "填写可直接播放的视频链接",
    livePreview: "即时预览",
    uploadTip: "这是后台管理系统原型。当前数据保存在本浏览器，如需多人共用、账号登录和云端同步，可以继续接真实后端。",
    viewPublic: "查看前台站点",
  },
  en: {
    admin: "Admin",
    switchLabel: "中文",
    adminTitle: "Visual Website Admin",
    adminDesc: "All changes are auto-saved in this browser and reflected on the public site immediately.",
    adminSite: "Branding",
    adminHome: "Home",
    adminAbout: "About",
    adminProducts: "Products",
    adminContact: "Contact",
    adminTools: "Data Tools",
    saveState: "Auto-saved",
    exportData: "Export Config",
    importData: "Import Config",
    resetData: "Reset Default",
    addProduct: "Add Product",
    deleteProduct: "Delete Product",
    formZhName: "Chinese Name",
    formEnName: "English Name",
    formZhSub: "Chinese Subtitle",
    formEnSub: "English Subtitle",
    heroTag: "Hero Tag",
    heroTitle: "Hero Title",
    heroDesc: "Hero Description",
    zhTitle: "Chinese Title",
    enTitle: "English Title",
    zhText: "Chinese Content",
    enText: "English Content",
    descZh: "Chinese Description",
    descEn: "English Description",
    productList: "Products",
    productEditor: "Product Editor",
    category: "Category",
    model: "Model",
    price: "Price",
    shortDesc: "Card Description",
    intro: "Introduction",
    features: "Features",
    specs: "Specifications",
    images: "Images",
    video: "Video",
    imageTip: "One image URL per line",
    featureTip: "One feature per line",
    specTip: "Use “Label: Value” per line",
    videoTip: "Enter a direct video URL",
    livePreview: "Live Preview",
    uploadTip: "This is an admin prototype. Data is stored in this browser. Shared login and cloud sync would need a real backend next.",
    viewPublic: "Open Public Site",
  },
};

export const productTypeOptions = defaultSiteData.productCategories.map((item) => ({
  key: item.key,
  publicKey: item.key,
  zh: item.zh,
  en: item.en,
}));

export function loadSiteData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultSiteData;
    }
    return JSON.parse(raw);
  } catch {
    return defaultSiteData;
  }
}

export function useSiteData() {
  const [siteData, setSiteData] = useState(() => normalizeSiteData(loadSiteData()));
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;

    const hydrate = async () => {
      let nextData = normalizeSiteData(loadSiteData());

      if (cloudEnabled) {
        try {
          const remoteData = await fetchSiteContent();
          if (remoteData) {
            nextData = normalizeSiteData(remoteData);
          }
        } catch {
          // Keep local data when cloud content is unavailable.
        }
      }

      if (!active) {
        return;
      }

      setSiteData(nextData);
      setHydrated(true);
    };

    hydrate();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(siteData));
    } catch (error) {
      console.warn("Site data was too large to save in local browser storage.", error);
    }
  }, [siteData, hydrated]);

  return [siteData, setSiteData, hydrated];
}

export function createProductDraft(defaultType = "portable") {
  return {
    id: `product-${Date.now()}`,
    type: defaultType,
    model: "NEW-MODEL",
    price: "$0",
    name: { zh: "新产品", en: "New Product" },
    short: { zh: "这里填写产品卡片简介。", en: "Add a short product description here." },
    intro: { zh: "这里填写产品详细介绍。", en: "Add a detailed product introduction here." },
    features: { zh: ["特点一", "特点二"], en: ["Feature One", "Feature Two"] },
    specs: [
      { label: "Power", value: "1000W" },
      { label: "Pressure", value: "100 Bar" },
    ],
    images: ["https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=1400&q=80"],
    video: "https://www.w3schools.com/html/mov_bbb.mp4",
  };
}

export function parseLines(value) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseSpecs(value) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, ...rest] = line.split(":");
      return { label: label.trim(), value: rest.join(":").trim() };
    })
    .filter((item) => item.label && item.value);
}
