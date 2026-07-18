import { useCallback, useEffect, useMemo, useState } from "react";

const locales = new Set(["zh", "en"]);

function normalizePath(pathname) {
  const clean = String(pathname || "/").split(/[?#]/)[0].replace(/\/{2,}/g, "/");
  return clean === "/" ? "/" : clean.replace(/\/$/, "");
}

export function localizePath(locale, path = "") {
  const suffix = String(path).replace(/^\/+|\/+$/g, "");
  return `/${locale}${suffix ? `/${suffix}` : ""}/`;
}

function parsePath(pathname) {
  const path = normalizePath(pathname);
  if (path === "/") {
    return { locale: "zh", route: "home", path: "/zh/", params: {} };
  }

  const segments = path.split("/").filter(Boolean);
  const locale = locales.has(segments[0]) ? segments[0] : "zh";
  const rest = locales.has(segments[0]) ? segments.slice(1) : segments;

  if (rest.length === 0) return { locale, route: "home", path, params: {} };
  if (rest[0] === "products" && rest[1]) {
    return { locale, route: "product", path, params: { slug: rest[1] } };
  }
  if (rest[0] === "products") return { locale, route: "products", path, params: {} };
  if (rest[0] === "support") return { locale, route: "support", path, params: {} };
  if (rest[0] === "company") return { locale, route: "company", path, params: {} };
  if (rest[0] === "contact") return { locale, route: "contact", path, params: {} };
  return { locale, route: "notFound", path, params: {} };
}

function currentLocation() {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

export function useRouter() {
  const [location, setLocation] = useState(currentLocation);

  useEffect(() => {
    if (window.location.pathname === "/") {
      window.history.replaceState({}, "", "/zh/");
      setLocation(currentLocation());
    }
    const onPopState = () => setLocation(currentLocation());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigate = useCallback((to, options = {}) => {
    const target = normalizePath(to);
    const href = target === "/" ? "/" : `${target}/`;
    window.history[options.replace ? "replaceState" : "pushState"]({}, "", href);
    setLocation(currentLocation());
  }, []);

  const parsed = useMemo(() => parsePath(location), [location]);

  const switchLocale = useCallback((nextLocale) => {
    const path = normalizePath(window.location.pathname);
    const segments = path.split("/").filter(Boolean);
    if (locales.has(segments[0])) segments[0] = nextLocale;
    else segments.unshift(nextLocale);
    navigate(`/${segments.join("/")}`);
  }, [navigate]);

  return { ...parsed, navigate, switchLocale };
}

export function SiteLink({ to, router, children, className, ariaCurrent, onClick, ...props }) {
  function handleClick(event) {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    router.navigate(to);
  }

  return (
    <a href={to} onClick={handleClick} className={className} aria-current={ariaCurrent} {...props}>
      {children}
    </a>
  );
}
