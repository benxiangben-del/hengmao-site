import { createCatalogDocument, createDemoProductRecord, normalizeCatalogDocument } from "../content/productModel.js";

const DB_NAME = "hengmao-local-workspace";
const DB_STORE = "handles";
const HANDLE_KEY = "project-root";
let projectHandle = null;

export const localWorkspaceSupported = typeof window !== "undefined" && "showDirectoryPicker" in window;

function openHandleDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(DB_STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function storeHandle(handle) {
  const database = await openHandleDatabase();
  await new Promise((resolve, reject) => {
    const transaction = database.transaction(DB_STORE, "readwrite");
    transaction.objectStore(DB_STORE).put(handle, HANDLE_KEY);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}

async function readStoredHandle() {
  const database = await openHandleDatabase();
  const handle = await new Promise((resolve, reject) => {
    const request = database.transaction(DB_STORE).objectStore(DB_STORE).get(HANDLE_KEY);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
  database.close();
  return handle;
}

async function ensurePermission(handle) {
  const options = { mode: "readwrite" };
  if ((await handle.queryPermission(options)) === "granted") return true;
  return (await handle.requestPermission(options)) === "granted";
}

async function fileText(directory, name) {
  const handle = await directory.getFileHandle(name);
  return (await handle.getFile()).text();
}

async function writeFile(directory, name, contents) {
  const handle = await directory.getFileHandle(name, { create: true });
  const writable = await handle.createWritable();
  await writable.write(contents);
  await writable.close();
}

async function ensureDirectory(root, segments) {
  let directory = root;
  for (const segment of segments) directory = await directory.getDirectoryHandle(segment, { create: true });
  return directory;
}

async function verifyProject(handle) {
  let packageData;
  try {
    packageData = JSON.parse(await fileText(handle, "package.json"));
  } catch {
    throw new Error("所选文件夹不是网站根目录。请选择 C:\\Users\\XR\\Desktop\\hengmao-site。");
  }
  if (packageData.name !== "hengmao-site") throw new Error("所选文件夹不是 hengmao-site 项目。");
}

async function readCatalog(handle) {
  try {
    const publicDirectory = await handle.getDirectoryHandle("public");
    const contentDirectory = await publicDirectory.getDirectoryHandle("content");
    return normalizeCatalogDocument(JSON.parse(await fileText(contentDirectory, "catalog.json")));
  } catch (error) {
    if (error?.name !== "NotFoundError") throw error;
    return createCatalogDocument([createDemoProductRecord()]);
  }
}

export async function connectLocalWorkspace() {
  if (!localWorkspaceSupported) throw new Error("当前浏览器不支持本地文件工作台，请使用最新版 Chrome 或 Edge 打开本地后台。");
  let handle = await readStoredHandle().catch(() => null);
  if (!handle || !(await ensurePermission(handle))) {
    handle = await window.showDirectoryPicker({ id: "hengmao-site-root", mode: "readwrite", startIn: "desktop" });
    if (!(await ensurePermission(handle))) throw new Error("需要授予项目文件夹读写权限才能保存产品。");
  }
  await verifyProject(handle);
  await storeHandle(handle).catch(() => undefined);
  projectHandle = handle;
  const catalog = await readCatalog(handle);
  return { name: handle.name, products: catalog.products, updatedAt: catalog.updatedAt };
}

export function workspaceIsConnected() {
  return Boolean(projectHandle);
}

export async function saveLocalCatalog(products) {
  if (!projectHandle) throw new Error("请先连接 hengmao-site 项目文件夹。");
  const document = createCatalogDocument(products);
  const normalizedProducts = document.products;
  const serialized = `${JSON.stringify(document, null, 2)}\n`;

  const publicContent = await ensureDirectory(projectHandle, ["public", "content"]);
  await writeFile(publicContent, "catalog.json", serialized);

  const productRoot = await ensureDirectory(projectHandle, ["content", "products"]);
  await writeFile(productRoot, "index.json", `${JSON.stringify({ schemaVersion: "1.0", updatedAt: document.updatedAt, products: normalizedProducts.map((item) => ({ id: item.id, slug: item.slug, status: item.status, markets: item.markets })) }, null, 2)}\n`);
  for (const product of normalizedProducts) {
    if (!product.slug) continue;
    const directory = await ensureDirectory(productRoot, [product.slug]);
    await writeFile(directory, "product.json", `${JSON.stringify(product, null, 2)}\n`);
  }
  return document;
}

function safeFileName(name) {
  const parts = String(name || "asset.bin").split(".");
  const extension = parts.length > 1 ? `.${parts.pop().replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}` : "";
  const base = parts.join("-").normalize("NFKD").replace(/[^a-zA-Z0-9-]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase() || "asset";
  return `${base}${extension}`;
}

export async function importLocalMedia(file, slug, role) {
  if (!projectHandle) throw new Error("请先连接 hengmao-site 项目文件夹。");
  if (!slug) throw new Error("请先填写并保存产品 URL slug。");
  if (file.size > 25 * 1024 * 1024) throw new Error("单个文件不能超过 25 MB；较大视频请先压缩或使用外部视频平台。");
  const kind = file.type.startsWith("video/") ? "video" : file.type.startsWith("image/") ? "image" : "document";
  const mediaDirectory = await ensureDirectory(projectHandle, ["public", "media", "products", slug]);
  const filename = `${Date.now()}-${safeFileName(file.name)}`;
  await writeFile(mediaDirectory, filename, file);
  return {
    assetKey: `${slug}-${role}-${Date.now()}`,
    url: `/media/products/${slug}/${filename}`,
    role: kind === "video" && !role.startsWith("video-") ? "video-demo" : role,
    kind,
    rightsStatus: "pending",
    altZh: "",
    altEn: "",
    originalFilename: file.name,
  };
}

export function downloadCatalogBackup(products) {
  const catalog = createCatalogDocument(products);
  const blob = new Blob([`${JSON.stringify(catalog, null, 2)}\n`], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = window.document.createElement("a");
  anchor.href = url;
  anchor.download = `hengmao-content-backup-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
