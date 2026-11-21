export function openCatalogUpdates() {
  // The workbench and preview share changes only on the local dev origin.
  return import.meta.env.DEV && typeof BroadcastChannel === "function"
    ? new BroadcastChannel("hengmao-catalog-updates")
    : null;
}

export function notifyCatalogSaved() {
  const channel = openCatalogUpdates();
  channel?.postMessage("saved");
  channel?.close();
}
