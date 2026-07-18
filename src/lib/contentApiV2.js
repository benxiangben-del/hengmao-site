import { isSupabaseConfigured, supabase } from "./supabase.js";

const CONTENT_SCHEMA = "content_v2";
const CONTENT_BUCKET = "hengmao-content-v2";
const LOCALES = ["zh-CN", "en"];
const GUIDE_TYPES = ["installation", "usage", "safety", "maintenance"];

function requireContentDb() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase 环境变量尚未配置。");
  }
  return supabase.schema(CONTENT_SCHEMA);
}

function throwOnError(result) {
  if (result.error) throw result.error;
  return result.data || [];
}

function publicAssetUrl(asset) {
  if (!asset) return "";
  if (asset.url) return asset.url;
  if (!asset.storage_bucket || !asset.storage_path) return "";
  return supabase.storage.from(asset.storage_bucket).getPublicUrl(asset.storage_path).data.publicUrl;
}

function listToText(value) {
  if (!Array.isArray(value)) return "";
  return value.map((item) => typeof item === "string" ? item : item.title || item.description || "").filter(Boolean).join("\n");
}

function textToList(value) {
  return String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => ({ key: `item-${index + 1}`, title: line, description: "" }));
}

function stepsToText(value) {
  if (!Array.isArray(value)) return "";
  return value.map((step) => step.body || step.title || "").filter(Boolean).join("\n");
}

function textToSteps(value) {
  return String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => ({
      key: `step-${index + 1}`,
      order: index + 1,
      title: line,
      body: line,
      media_asset_key: null,
    }));
}

function defaultTranslation() {
  return {
    status: "draft",
    name: "",
    shortDescription: "",
    description: "",
    featuresText: "",
    applicationsText: "",
    seoTitle: "",
    seoDescription: "",
  };
}

function defaultGuide() {
  return {
    requirement: "pending",
    version: "1.0",
    technicalReviewStatus: "unverified",
    zhStatus: "draft",
    enStatus: "draft",
    zhContent: "",
    enContent: "",
  };
}

async function fetchContentRows() {
  const db = requireContentDb();
  const results = await Promise.all([
    db.from("product_categories").select("*"),
    db.from("products").select("*").order("sort_order", { ascending: true }),
    db.from("product_translations").select("*"),
    db.from("product_specifications").select("*").order("sort_order", { ascending: true }),
    db.from("product_package_items").select("*").order("sort_order", { ascending: true }),
    db.from("media_assets").select("*"),
    db.from("product_media").select("*").order("sort_order", { ascending: true }),
    db.from("guides").select("*"),
    db.from("guide_translations").select("*"),
    db.from("product_guides").select("*"),
    db.from("product_documents").select("*"),
    db.from("content_placements").select("*").order("sort_order", { ascending: true }),
  ]);
  const [categories, products, translations, specifications, packageItems, assets, productMedia, guides, guideTranslations, productGuides, documents, placements] = results.map(throwOnError);
  return { categories, products, translations, specifications, packageItems, assets, productMedia, guides, guideTranslations, productGuides, documents, placements };
}

function normalizeRecord(product, rows) {
  const category = rows.categories.find((item) => item.id === product.category_id);
  const translations = Object.fromEntries(LOCALES.map((locale) => {
    const row = rows.translations.find((item) => item.product_id === product.id && item.locale === locale);
    return [locale, row ? {
      status: row.translation_status,
      name: row.name || "",
      shortDescription: row.short_description || "",
      description: row.description || "",
      featuresText: listToText(row.features),
      applicationsText: listToText(row.applications),
      seoTitle: row.seo_title || "",
      seoDescription: row.seo_description || "",
    } : defaultTranslation()];
  }));

  const assetById = new Map(rows.assets.map((asset) => [asset.id, asset]));
  const media = rows.productMedia
    .filter((item) => item.product_id === product.id && item.is_active)
    .map((item) => {
      const asset = assetById.get(item.media_asset_id);
      return {
        id: item.id,
        assetId: asset?.id,
        assetKey: asset?.asset_key || item.id,
        url: publicAssetUrl(asset),
        role: item.role,
        kind: asset?.kind || "image",
        rightsStatus: asset?.rights_status || "pending",
        altZh: item.alt_zh || "",
        altEn: item.alt_en || "",
      };
    });

  const guideState = Object.fromEntries(GUIDE_TYPES.map((type) => {
    const link = rows.productGuides.find((item) => item.product_id === product.id && rows.guides.find((guide) => guide.id === item.guide_id)?.guide_type === type);
    const guide = link ? rows.guides.find((item) => item.id === link.guide_id) : null;
    const zh = guide ? rows.guideTranslations.find((item) => item.guide_id === guide.id && item.locale === "zh-CN") : null;
    const en = guide ? rows.guideTranslations.find((item) => item.guide_id === guide.id && item.locale === "en") : null;
    return [type, guide ? {
      requirement: "required",
      version: guide.version,
      technicalReviewStatus: guide.technical_review_status,
      zhStatus: zh?.translation_status || "draft",
      enStatus: en?.translation_status || "draft",
      zhContent: stepsToText(zh?.steps) || zh?.body || "",
      enContent: stepsToText(en?.steps) || en?.body || "",
    } : defaultGuide()];
  }));

  const hero = rows.placements.find((item) => item.product_id === product.id && item.placement_key === "home-hero" && item.is_active);
  return {
    id: product.id,
    model: product.model,
    slug: product.slug,
    categoryKey: category?.key || "accessory",
    category: { zh: category?.name_zh || "", en: category?.name_en || "" },
    status: product.status,
    lifecycleStatus: product.lifecycle_status,
    sortOrder: product.sort_order,
    translations,
    specifications: rows.specifications.filter((item) => item.product_id === product.id).map((item) => ({
      id: item.id,
      key: item.spec_key,
      groupKey: item.group_key,
      labelZh: item.label_zh,
      labelEn: item.label_en,
      valueText: item.value_text ?? (item.value_number !== null ? String(item.value_number) : ""),
      valueNumber: item.value_number,
      unitCode: item.unit_code || "",
      sourceReference: item.source_reference || "",
      verificationStatus: item.verification_status,
      isKeySpec: item.is_key_spec,
    })),
    packageContents: rows.packageItems.filter((item) => item.product_id === product.id).map((item) => ({
      id: item.id,
      key: item.item_key,
      quantity: Number(item.quantity),
      unitCode: item.unit_code,
      nameZh: item.name_zh,
      nameEn: item.name_en,
    })),
    guides: guideState,
    media,
    documents: rows.documents.filter((item) => item.product_id === product.id).map((item) => ({
      ...item,
      asset: assetById.get(item.media_asset_id),
      url: publicAssetUrl(assetById.get(item.media_asset_id)),
    })),
    placements: { homeHero: Boolean(hero), homeHeroOrder: hero?.sort_order || 0 },
    updatedAt: product.updated_at,
  };
}

export async function fetchAdminProductRecords() {
  const rows = await fetchContentRows();
  return rows.products.map((product) => normalizeRecord(product, rows));
}

export async function fetchPublicProductRecords(locale = "zh-CN") {
  const records = await fetchAdminProductRecords();
  return records.filter((record) => record.status === "published" && record.translations[locale]?.status === "published");
}

async function categoryIdForKey(db, key) {
  const { data, error } = await db.from("product_categories").select("id").eq("key", key).single();
  if (error) throw error;
  return data.id;
}

async function replaceProductRows(db, table, productId, rows) {
  const { error: deleteError } = await db.from(table).delete().eq("product_id", productId);
  if (deleteError) throw deleteError;
  if (!rows.length) return;
  const { error: insertError } = await db.from(table).insert(rows);
  if (insertError) throw insertError;
}

async function saveMediaMetadata(db, record, productId) {
  if ((record.media || []).some((item) => item.role === "cover")) {
    const { error: coverResetError } = await db.from("product_media").update({ is_active: false }).eq("product_id", productId).eq("role", "cover");
    if (coverResetError) throw coverResetError;
  }
  for (const item of record.media || []) {
    if (!item.assetId || !item.id) continue;
    const { error: assetError } = await db.from("media_assets").update({
      rights_status: item.rightsStatus || "pending",
    }).eq("id", item.assetId);
    if (assetError) throw assetError;
    const { error: linkError } = await db.from("product_media").update({
      role: item.role,
      alt_zh: item.altZh || null,
      alt_en: item.altEn || null,
      is_active: true,
    }).eq("id", item.id);
    if (linkError) throw linkError;
  }
}

async function saveGuides(db, productId, productSlug, guides, userId) {
  for (const type of GUIDE_TYPES) {
    const item = guides[type];
    if (!item || item.requirement === "pending") continue;
    const slug = `${productSlug}-${type}`;
    const approved = item.technicalReviewStatus === "approved";
    const published = approved && (item.zhStatus === "published" || item.enStatus === "published");
    const { data: guide, error: guideError } = await db.from("guides").upsert({
      slug,
      guide_type: type,
      status: published ? "published" : approved ? "review" : "draft",
      version: item.version || "1.0",
      technical_review_status: item.technicalReviewStatus,
      reviewed_by: approved ? userId : null,
      reviewed_at: approved ? new Date().toISOString() : null,
      published_at: published ? new Date().toISOString() : null,
      updated_by: userId,
    }, { onConflict: "slug" }).select("id").single();
    if (guideError) throw guideError;
    const guideTranslations = [
      { locale: "zh-CN", content: item.zhContent, status: item.zhStatus },
      { locale: "en", content: item.enContent, status: item.enStatus },
    ].map((translation) => ({
      guide_id: guide.id,
      locale: translation.locale,
      title: translation.locale === "zh-CN" ? `${productSlug} ${type} 指南` : `${productSlug} ${type} guide`,
      summary: "",
      steps: textToSteps(translation.content),
      warnings: [],
      body: "",
      translation_status: translation.status || "draft",
      reviewed_by: translation.status === "published" ? userId : null,
      reviewed_at: translation.status === "published" ? new Date().toISOString() : null,
    }));
    const { error: translationError } = await db.from("guide_translations").upsert(guideTranslations, { onConflict: "guide_id,locale" });
    if (translationError) throw translationError;
    const { error: linkError } = await db.from("product_guides").upsert({
      product_id: productId,
      guide_id: guide.id,
      relationship: "dedicated",
      is_primary: true,
    }, { onConflict: "product_id,guide_id" });
    if (linkError) throw linkError;
  }
}

export async function saveAdminProductRecord(record) {
  const db = requireContentDb();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) throw authError || new Error("管理员登录状态已失效，请重新登录。");
  const userId = authData.user.id;
  const categoryId = await categoryIdForKey(db, record.categoryKey);
  const wantsPublished = record.status === "published";
  const rootPayload = {
    model: record.model.trim(),
    slug: record.slug.trim(),
    category_id: categoryId,
    status: wantsPublished ? "review" : record.status,
    lifecycle_status: record.lifecycleStatus,
    sort_order: Number(record.sortOrder) || 0,
    updated_by: userId,
  };
  let product;
  if (record.id && !String(record.id).startsWith("preview-") && record.id !== "demo-local-product") {
    const result = await db.from("products").update(rootPayload).eq("id", record.id).select("*").single();
    product = throwOnError(result);
  } else {
    const result = await db.from("products").insert({ ...rootPayload, created_by: userId }).select("*").single();
    product = throwOnError(result);
  }

  const translationRows = LOCALES.map((locale) => {
    const item = record.translations[locale];
    return {
      product_id: product.id,
      locale,
      name: item.name || null,
      short_description: item.shortDescription || null,
      description: item.description || null,
      features: textToList(item.featuresText),
      applications: textToList(item.applicationsText),
      seo_title: item.seoTitle || null,
      seo_description: item.seoDescription || null,
      translation_status: item.status || "draft",
      reviewed_by: item.status === "published" ? userId : null,
      reviewed_at: item.status === "published" ? new Date().toISOString() : null,
    };
  });
  const { error: translationError } = await db.from("product_translations").upsert(translationRows, { onConflict: "product_id,locale" });
  if (translationError) throw translationError;

  await replaceProductRows(db, "product_specifications", product.id, record.specifications.map((item, index) => ({
    product_id: product.id,
    spec_key: item.key,
    group_key: item.groupKey || "other",
    label_zh: item.labelZh,
    label_en: item.labelEn,
    value_text: item.valueText || null,
    value_number: item.valueNumber ?? null,
    unit_code: item.unitCode || null,
    sort_order: index,
    is_key_spec: Boolean(item.isKeySpec),
    verification_status: item.verificationStatus || "unverified",
    source_reference: item.sourceReference || null,
    reviewed_by: item.verificationStatus === "approved" ? userId : null,
    reviewed_at: item.verificationStatus === "approved" ? new Date().toISOString() : null,
  })));

  await replaceProductRows(db, "product_package_items", product.id, record.packageContents.map((item, index) => ({
    product_id: product.id,
    item_key: item.key,
    quantity: Number(item.quantity) || 1,
    unit_code: item.unitCode || "pc",
    name_zh: item.nameZh,
    name_en: item.nameEn,
    sort_order: index,
  })));

  await saveMediaMetadata(db, record, product.id);
  await saveGuides(db, product.id, product.slug, record.guides, userId);

  const { error: placementDeleteError } = await db.from("content_placements").delete().eq("product_id", product.id).eq("placement_key", "home-hero");
  if (placementDeleteError) throw placementDeleteError;
  if (record.placements.homeHero) {
    const { error: placementError } = await db.from("content_placements").insert({
      placement_key: "home-hero",
      product_id: product.id,
      sort_order: Number(record.placements.homeHeroOrder) || 0,
      is_active: true,
    });
    if (placementError) throw placementError;
  }

  if (wantsPublished) {
    const { error: publishError } = await db.from("products").update({
      status: "published",
      published_at: new Date().toISOString(),
      updated_by: userId,
    }).eq("id", product.id);
    if (publishError) throw publishError;
  }

  const records = await fetchAdminProductRecords();
  return records.find((item) => item.id === product.id);
}

export async function uploadAdminProductMedia(productId, file, role = "gallery") {
  if (!productId || String(productId).startsWith("preview-") || productId === "demo-local-product") {
    throw new Error("请先把产品保存到 Supabase，再上传素材。");
  }
  if (!file) throw new Error("请选择要上传的文件。");
  const db = requireContentDb();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) throw authError || new Error("管理员登录状态已失效，请重新登录。");

  const kind = file.type.startsWith("video/") ? "video" : file.type.startsWith("image/") ? "image" : null;
  if (!kind) throw new Error("产品媒体只接受图片或视频；说明书将在资料模块上传。");
  const extension = String(file.name.split(".").pop() || "bin").replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "bin";
  const token = crypto.randomUUID();
  const storagePath = `products/${productId}/${token}.${extension}`;
  const assetKey = `asset-${Date.now()}-${token.slice(0, 8)}`;

  const { error: uploadError } = await supabase.storage.from(CONTENT_BUCKET).upload(storagePath, file, {
    cacheControl: "3600",
    contentType: file.type || undefined,
    upsert: false,
  });
  if (uploadError) throw uploadError;

  let asset;
  try {
    const result = await db.from("media_assets").insert({
      asset_key: assetKey,
      kind,
      storage_bucket: CONTENT_BUCKET,
      storage_path: storagePath,
      original_filename: file.name,
      mime_type: file.type || "application/octet-stream",
      file_size: file.size,
      rights_status: "pending",
      created_by: authData.user.id,
    }).select("*").single();
    asset = throwOnError(result);

    if (role === "cover") {
      const { error: coverError } = await db.from("product_media").update({ is_active: false }).eq("product_id", productId).eq("role", "cover");
      if (coverError) throw coverError;
    }
    const mediaRole = kind === "video" && !String(role).startsWith("video-") ? "video-demo" : role;
    const { error: linkError } = await db.from("product_media").insert({
      product_id: productId,
      media_asset_id: asset.id,
      role: mediaRole,
      sort_order: 0,
      is_active: true,
    });
    if (linkError) throw linkError;
  } catch (error) {
    if (asset?.id) await db.from("media_assets").delete().eq("id", asset.id);
    await supabase.storage.from(CONTENT_BUCKET).remove([storagePath]);
    throw error;
  }

  const records = await fetchAdminProductRecords();
  return records.find((item) => item.id === productId);
}

export function toPublicProduct(record) {
  const cover = record.media.find((item) => item.role === "cover") || record.media[0];
  return {
    id: record.id,
    slug: record.slug,
    model: record.model,
    status: record.status,
    category: record.category,
    name: {
      zh: record.translations["zh-CN"].name,
      en: record.translations.en.name,
    },
    summary: {
      zh: record.translations["zh-CN"].shortDescription,
      en: record.translations.en.shortDescription,
    },
    description: {
      zh: record.translations["zh-CN"].description,
      en: record.translations.en.description,
    },
    image: cover?.url || "",
    media: record.media,
    specifications: record.specifications,
    packageContents: record.packageContents,
    guides: record.guides,
    documents: record.documents,
    placements: record.placements,
  };
}
