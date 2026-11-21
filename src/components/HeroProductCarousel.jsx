import { useEffect, useRef, useState } from "react";
import Icon from "./Icon.jsx";
import ProductParticles from "./ProductParticles.jsx";

const AUTOPLAY_DELAY = 6000;

export default function HeroProductCarousel({ lang, text, products, demoMode = false }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [rotationEnabled, setRotationEnabled] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [selectionCount, setSelectionCount] = useState(0);
  const touchStart = useRef(null);
  const currentIndex = activeIndex < products.length ? activeIndex : 0;
  const product = products[currentIndex];
  const canRotate = products.length > 1 && !reducedMotion;
  const rotating = canRotate && rotationEnabled;

  function show(index) {
    const count = products.length;
    setActiveIndex((index + count) % count);
    setSelectionCount((count) => count + 1);
  }

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!rotating) return undefined;
    const timer = window.setTimeout(() => {
      setActiveIndex((currentIndex + 1) % products.length);
    }, AUTOPLAY_DELAY);
    return () => window.clearTimeout(timer);
  }, [rotating, currentIndex, products.length, selectionCount]);

  function onTouchStart(event) {
    touchStart.current = event.changedTouches[0];
  }

  function onTouchEnd(event) {
    const start = touchStart.current;
    const end = event.changedTouches[0];
    touchStart.current = null;
    if (!start || !end || products.length < 2) return;
    const dx = end.clientX - start.clientX;
    const dy = end.clientY - start.clientY;
    if (Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy)) show(currentIndex + (dx < 0 ? 1 : -1));
  }

  if (!product) return null;

  return (
    <div
      className="hero-product hero-carousel"
      role="region"
      aria-roledescription={lang === "zh" ? "产品轮播" : "Product carousel"}
      aria-label={demoMode ? (lang === "zh" ? "演示产品款式" : "Demo product styles") : (lang === "zh" ? "推荐产品" : "Featured products")}
    >
      <div
        className="hero-product-stage"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onTouchCancel={() => { touchStart.current = null; }}
      >
        <div className="hero-stage-guides" aria-hidden="true" />
        {products.map((item, index) => (
          <div key={item.id} className={index === currentIndex ? "hero-slide is-active" : "hero-slide"} aria-hidden={index !== currentIndex}>
            <img
              className={`hero-carousel-image hero-carousel-image--${item.size}`}
              src={item.image}
              alt={item.name[lang]}
              decoding="async"
              fetchPriority={index === 0 ? "high" : "low"}
            />
          </div>
        ))}
        <ProductParticles key={product.id} image={product.image} />
      </div>

      <div className="hero-product-caption" aria-live={rotating ? "off" : "polite"} aria-atomic="true">
        <div key={product.id} className="hero-caption-content">
          <span>{product.category[lang]}</span>
          <strong>{product.name[lang]}</strong>
          <small>{product.model[lang]}</small>
        </div>
      </div>

      {products.length > 1 && (
        <div className="carousel-controls">
          <button
            className="carousel-arrow"
            type="button"
            onClick={() => show(currentIndex - 1)}
            aria-label={lang === "zh" ? "上一款机器" : "Previous machine"}
          >
            <Icon name="previous" size={22} />
          </button>
          <div className="carousel-dots" role="group" aria-label={lang === "zh" ? "选择机器款式" : "Choose a machine style"}>
            {products.map((item, index) => (
              <button
                key={item.id}
                type="button"
                aria-label={`${lang === "zh" ? "查看" : "View"} ${item.name[lang]}`}
                aria-current={index === currentIndex ? "true" : undefined}
                onClick={() => show(index)}
              >
                <span />
              </button>
            ))}
          </div>
          <button
            className="carousel-arrow"
            type="button"
            onClick={() => show(currentIndex + 1)}
            aria-label={lang === "zh" ? "下一款机器" : "Next machine"}
          >
            <Icon name="next" size={22} />
          </button>
          {canRotate && (
            <button
              className="carousel-arrow"
              type="button"
              onClick={() => setRotationEnabled((enabled) => !enabled)}
              aria-label={rotationEnabled
                ? (lang === "zh" ? "暂停轮播" : "Pause slideshow")
                : (lang === "zh" ? "播放轮播" : "Play slideshow")}
            >
              <Icon name={rotationEnabled ? "pause" : "play"} size={18} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
