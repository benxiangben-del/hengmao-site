import { access, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const catalogPath = path.join(root, "public", "content", "catalog.json");
const errors = [];
const warnings = [];

function issue(list, product, message) {
  list.push(`${product?.slug || product?.model || "catalog"}: ${message}`);
}

function text(value) {
  return typeof value === "string" && value.trim().length > 0;
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

let catalog;
try {
  catalog = JSON.parse(await readFile(catalogPath, "utf8"));
} catch (error) {
  console.error(`Content validation failed: cannot read ${catalogPath}\n${error.message}`);
  process.exit(1);
}

if (catalog.schemaVersion !== "1.0") errors.push("catalog: schemaVersion must be 1.0");
if (!Array.isArray(catalog.products)) errors.push("catalog: products must be an array");

const products = Array.isArray(catalog.products) ? catalog.products : [];
const unique = { id: new Set(), slug: new Set(), model: new Set() };

for (const product of products) {
  const markets = product.markets && (typeof product.markets.cn === "boolean" || typeof product.markets.global === "boolean")
    ? { cn: Boolean(product.markets.cn), global: Boolean(product.markets.global) }
    : { cn: true, global: true };
  for (const field of ["id", "slug", "model"]) {
    if (!text(product[field])) issue(errors, product, `${field} is required`);
    else if (unique[field].has(product[field])) issue(errors, product, `${field} must be unique (${product[field]})`);
    else unique[field].add(product[field]);
  }
  if (text(product.slug) && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(product.slug)) issue(errors, product, "slug must use lowercase letters, numbers and hyphens only");
  if (!product.translations?.["zh-CN"] || !product.translations?.en) issue(errors, product, "both zh-CN and en translations are required");
  if (!product.guides?.safety) issue(errors, product, "safety guide is required");
  if (!Array.isArray(product.media)) issue(errors, product, "media must be an array");
  if (!Array.isArray(product.specifications)) issue(errors, product, "specifications must be an array");

  const sourcePath = path.join(root, "content", "products", product.slug || "_missing", "product.json");
  if (!(await exists(sourcePath))) issue(errors, product, `source record is missing: content/products/${product.slug}/product.json`);
  else {
    try {
      const source = JSON.parse(await readFile(sourcePath, "utf8"));
      if (JSON.stringify(source) !== JSON.stringify(product)) issue(errors, product, "source record and public catalog are out of sync");
    } catch (error) {
      issue(errors, product, `source record is invalid JSON (${error.message})`);
    }
  }

  for (const media of Array.isArray(product.media) ? product.media : []) {
    if (!text(media.url)) {
      issue(errors, product, "every media record needs a URL");
      continue;
    }
    if (media.url.startsWith("/media/")) {
      const mediaPath = path.join(root, "public", ...media.url.slice(1).split("/"));
      if (!(await exists(mediaPath))) issue(errors, product, `media file is missing: ${media.url}`);
    }
  }

  const heroImages = product.media?.filter((item) => item.role === "home-hero") || [];
  if (heroImages.length > 1) issue(errors, product, "a product can have only one home-hero image");

  if (product.status !== "published") {
    if (markets.cn && !text(product.translations?.["zh-CN"]?.name)) issue(warnings, product, "China-market draft is missing a Chinese name");
    if (markets.global && !text(product.translations?.en?.name)) issue(warnings, product, "global-market draft is missing an English name");
    continue;
  }

  if (!markets.cn && !markets.global) issue(errors, product, "published products must target at least one market");
  const publishingLocales = [markets.cn ? "zh-CN" : null, markets.global ? "en" : null].filter(Boolean);
  for (const locale of publishingLocales) {
    const translation = product.translations?.[locale];
    if (translation?.status !== "published") issue(errors, product, `${locale} translation must be published`);
    for (const field of ["name", "shortDescription", "description", "seoTitle", "seoDescription"]) {
      if (!text(translation?.[field])) issue(errors, product, `${locale}.${field} is required for publishing`);
    }
  }
  const covers = product.media?.filter((item) => item.role === "cover") || [];
  if (covers.length !== 1) issue(errors, product, "published products need exactly one cover image");
  if (!covers.some((item) => item.rightsStatus === "approved")) issue(errors, product, "cover image rights must be approved");
  if (product.placements?.homeHero && !heroImages.some((item) => item.kind === "image" && item.rightsStatus === "approved")) issue(errors, product, "products placed in the homepage carousel need one approved home-hero image");
  if (!product.specifications?.length) issue(errors, product, "published products need verified specifications");
  for (const spec of product.specifications || []) {
    if (spec.verificationStatus !== "approved" || !text(spec.sourceReference)) issue(errors, product, "every specification must be approved and have a source reference");
  }
  if (product.guides?.safety?.technicalReviewStatus !== "approved") issue(errors, product, "safety guide must pass technical review");
}

for (const warning of warnings) console.warn(`WARNING ${warning}`);
if (errors.length) {
  for (const error of errors) console.error(`ERROR ${error}`);
  console.error(`\nContent validation failed with ${errors.length} error(s).`);
  process.exit(1);
}

console.log(`Content validation passed: ${products.length} product record(s), ${warnings.length} warning(s).`);
