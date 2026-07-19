export const PRODUCT_CATEGORIES = [
  { key: "portable-washer", zh: "便携式清洗设备", en: "Portable Washers" },
  { key: "trolley-washer", zh: "推车式清洗设备", en: "Trolley Washers" },
  { key: "spray-gun", zh: "水枪", en: "Spray Guns" },
  { key: "high-pressure-hose", zh: "高压管", en: "High-pressure Hoses" },
  { key: "steel-wire-hose", zh: "钢丝管", en: "Steel-wire Hoses" },
  { key: "accessory", zh: "其他配件", en: "Other Accessories" },
];

export const DEFAULT_MARKETS = { cn: true, global: true };

export function normalizeProductMarkets(markets) {
  if (!markets || (typeof markets.cn !== "boolean" && typeof markets.global !== "boolean")) return { ...DEFAULT_MARKETS };
  return { cn: Boolean(markets.cn), global: Boolean(markets.global) };
}

export function normalizeProductRecord(record) {
  return { ...record, markets: normalizeProductMarkets(record?.markets) };
}

export const EMPTY_TRANSLATION = {
  status: "draft",
  name: "",
  shortDescription: "",
  description: "",
  featuresText: "",
  applicationsText: "",
  seoTitle: "",
  seoDescription: "",
};

export const EMPTY_GUIDE = {
  requirement: "pending",
  version: "1.0",
  technicalReviewStatus: "unverified",
  zhStatus: "draft",
  enStatus: "draft",
  zhContent: "",
  enContent: "",
};

export function createEmptyProductRecord() {
  return {
    id: null,
    model: "",
    slug: "",
    categoryKey: "portable-washer",
    status: "draft",
    lifecycleStatus: "active",
    markets: { ...DEFAULT_MARKETS },
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

export function createDemoProductRecord() {
  return {
    ...createEmptyProductRecord(),
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

export function createCatalogDocument(products, updatedAt = new Date().toISOString()) {
  return {
    schemaVersion: "1.0",
    updatedAt,
    products: products.map(normalizeProductRecord),
  };
}

export function normalizeCatalogDocument(value) {
  if (!value || !Array.isArray(value.products)) throw new Error("产品目录格式无效：缺少 products 数组。");
  return createCatalogDocument(value.products, value.updatedAt || new Date().toISOString());
}

export function categoryForKey(key) {
  const category = PRODUCT_CATEGORIES.find((item) => item.key === key) || PRODUCT_CATEGORIES.at(-1);
  return { zh: category.zh, en: category.en };
}

export function toPublicProduct(record) {
  const cover = record.media?.find((item) => item.role === "cover") || record.media?.find((item) => item.kind === "image");
  const hero = record.media?.find((item) => item.role === "home-hero" && item.kind === "image" && item.rightsStatus === "approved");
  return {
    id: record.id || record.slug,
    slug: record.slug,
    model: record.model,
    status: record.status,
    markets: normalizeProductMarkets(record.markets),
    category: categoryForKey(record.categoryKey),
    name: {
      zh: record.translations?.["zh-CN"]?.name || "",
      en: record.translations?.en?.name || "",
    },
    summary: {
      zh: record.translations?.["zh-CN"]?.shortDescription || "",
      en: record.translations?.en?.shortDescription || "",
    },
    description: {
      zh: record.translations?.["zh-CN"]?.description || "",
      en: record.translations?.en?.description || "",
    },
    image: cover?.url || "",
    heroImage: hero?.url || "",
    media: record.media || [],
    specifications: record.specifications || [],
    packageContents: record.packageContents || [],
    guides: record.guides || {},
    documents: record.documents || [],
    placements: record.placements || { homeHero: false, homeHeroOrder: 0 },
  };
}

export function publicRecordsForLocale(records, locale, market) {
  return records.filter((record) => {
    const markets = normalizeProductMarkets(record.markets);
    return record.status === "published" && markets[market] && record.translations?.[locale]?.status === "published";
  });
}
