export const brand = {
  wordmark: "HENGMAO",
  zhName: "上海恒猫机电",
  enName: "Shanghai Hengmao Machinery",
  zhTagline: "可靠设备，清洁更高效",
  enTagline: "Reliable Equipment. Cleaner Results.",
};

export const demoProduct = {
  slug: "demo-portable-washer",
  model: "型号待确认",
  category: { zh: "便携式清洗设备", en: "Portable Cleaning Equipment" },
  name: { zh: "便携式高压清洗设备（演示）", en: "Portable Pressure Washer (Demo)" },
  summary: {
    zh: "本页面用于验证官网产品结构与视觉。正式型号、参数、安装说明和安全内容将在资料确认后填写。",
    en: "This page demonstrates the product structure and visual system. The final model, specifications, installation instructions and safety content will be added after verification.",
  },
  image: "/media/demo/demo-portable-washer.png",
  video: "/media/demo/demo-product-video.mp4",
  status: "demo",
  specs: [],
};

export const heroProducts = [
  {
    id: "portable-black",
    image: "/media/demo/demo-portable-washer.png",
    category: { zh: "便携式清洗设备", en: "Portable Cleaning Equipment" },
    name: { zh: "便携式高压清洗设备（演示）", en: "Portable Pressure Washer (Demo)" },
    model: { zh: "款式 01 · 型号待确认", en: "Style 01 · Model pending" },
    size: "standard",
  },
  {
    id: "portable-white-green",
    image: "/media/demo/demo-portable-washer-white-green.png",
    category: { zh: "便携式清洗设备", en: "Portable Cleaning Equipment" },
    name: { zh: "轻量便携清洗设备（演示）", en: "Compact Portable Washer (Demo)" },
    model: { zh: "款式 02 · 型号待确认", en: "Style 02 · Model pending" },
    size: "wide",
  },
  {
    id: "portable-red",
    image: "/media/demo/demo-portable-washer-red.png",
    category: { zh: "便携式清洗设备", en: "Portable Cleaning Equipment" },
    name: { zh: "紧凑型清洗设备（演示）", en: "Compact Cleaning Unit (Demo)" },
    model: { zh: "款式 03 · 型号待确认", en: "Style 03 · Model pending" },
    size: "compact",
  },
  {
    id: "portable-classic",
    image: "/media/demo/demo-portable-washer-classic.png",
    category: { zh: "便携式清洗设备", en: "Portable Cleaning Equipment" },
    name: { zh: "经典便携清洗设备（演示）", en: "Classic Portable Washer (Demo)" },
    model: { zh: "款式 04 · 型号待确认", en: "Style 04 · Model pending" },
    size: "standard",
  },
];

export const copy = {
  zh: {
    skipToContent: "跳到主要内容",
    nav: { home: "首页", products: "产品中心", support: "安装与支持", company: "关于恒猫", contact: "联系我们" },
    language: "EN",
    menu: "菜单",
    modelSearch: "搜索产品型号",
    searchPlaceholder: "输入产品型号",
    searchAction: "查找产品",
    viewProducts: "查看产品",
    getSupport: "安装与支持",
    viewDetails: "查看详情",
    demo: "架构演示",
    pending: "资料准备中",
    notProvided: "资料尚未提供，后续可在后台补充。",
  },
  en: {
    skipToContent: "Skip to main content",
    nav: { home: "Home", products: "Products", support: "Installation & Support", company: "About HENGMAO", contact: "Contact" },
    language: "中文",
    menu: "Menu",
    modelSearch: "Search by model",
    searchPlaceholder: "Enter a product model",
    searchAction: "Find product",
    viewProducts: "View products",
    getSupport: "Installation & Support",
    viewDetails: "View details",
    demo: "Architecture demo",
    pending: "Content in preparation",
    notProvided: "Content has not been provided yet and can be added later in the CMS.",
  },
};
