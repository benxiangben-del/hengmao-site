import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { normalizeCatalogDocument, publicRecordsForLocale } from "../src/content/productModel.js";
import { demoProduct, heroProducts } from "../src/content/demoSite.js";

export function publicCatalog() {
  let config;
  return {
    name: "hengmao-public-catalog",
    apply: "build",
    configResolved(resolved) {
      config = resolved;
    },
    async writeBundle() {
      const source = resolve(config.root, "public");
      const output = resolve(config.root, config.build.outDir);
      const catalog = normalizeCatalogDocument(JSON.parse(await readFile(resolve(source, "content/catalog.json"), "utf8")));
      const markets = config.mode === "cn" ? ["cn"] : config.mode === "global" ? ["global"] : ["cn", "global"];
      const visible = new Set(markets.flatMap((market) => publicRecordsForLocale(catalog.products, market === "cn" ? "zh-CN" : "en", market)));
      const products = catalog.products.filter((record) => visible.has(record));
      const assets = new Set(["/favicon.svg", demoProduct.image, demoProduct.video, ...heroProducts.map(({ image }) => image)]);

      for (const product of products) {
        for (const { url } of product.media || []) assets.add(url);
        for (const { url, public_url, file_url } of product.documents || []) assets.add(url || public_url || file_url);
      }
      for (const url of assets) {
        if (typeof url !== "string" || !url.startsWith("/") || url.startsWith("//")) continue;
        const pathname = decodeURIComponent(url.split(/[?#]/, 1)[0]);
        const file = resolve(source, `.${pathname}`);
        const name = relative(source, file);
        if (!name || name === ".." || name.startsWith(`..${sep}`) || isAbsolute(name) || name === `content${sep}catalog.json`) {
          throw new Error(`Invalid public asset path: ${url}`);
        }
        const destination = resolve(output, name);
        await mkdir(dirname(destination), { recursive: true });
        await copyFile(file, destination);
      }

      const destination = resolve(output, "content/catalog.json");
      await mkdir(dirname(destination), { recursive: true });
      await writeFile(destination, `${JSON.stringify({ ...catalog, products }, null, 2)}\n`);
    },
  };
}
