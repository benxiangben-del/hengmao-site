const supportedMarkets = new Set(["cn", "global"]);
const configuredMarket = import.meta.env.VITE_SITE_MARKET;

export const siteMarket = supportedMarkets.has(configuredMarket) ? configuredMarket : "combined";
export const defaultSiteLocale = siteMarket === "global" ? "en" : "zh";

export function marketForLocale(lang) {
  if (siteMarket === "cn" || siteMarket === "global") return siteMarket;
  return lang === "en" ? "global" : "cn";
}
