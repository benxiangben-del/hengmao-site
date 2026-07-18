import { useEffect, useRef, useState } from "react";
import { heroProducts } from "../content/demoSite.js";
import Icon from "./Icon.jsx";

const AUTOPLAY_DELAY = 5200;

export default function HeroProductCarousel({ lang, text }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const touchStartX = useRef(null);
  const product = heroProducts[activeIndex];

  function show(index) {
    const count = heroProducts.length;
    setActiveIndex((index + count) % count);
  }

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (paused || reducedMotion) return undefined;
    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % heroProducts.length);
    }, AUTOPLAY_DELAY);
    return () => window.clearInterval(timer);
  }, [paused, reducedMotion, activeIndex]);

  function onTouchStart(event) {
    touchStartX.current = event.changedTouches[0]?.clientX ?? null;
  }

  function onTouchEnd(event) {
    if (touchStartX.current === null) return;
    const delta = (event.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
    if (Math.abs(delta) > 42) show(activeIndex + (delta < 0 ? 1 : -1));
    touchStartX.current = null;
  }

  return (
    <div
      className={`hero-product hero-carousel${paused || reducedMotion ? " is-paused" : ""}`}
      role="region"
      aria-roledescription={lang === "zh" ? "产品轮播" : "Product carousel"}
      aria-label={lang === "zh" ? "演示产品款式" : "Demo product styles"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="hero-product-halo" aria-hidden="true" />
      <div className="hero-orbit hero-orbit--outer" aria-hidden="true"><i /><i /><i /></div>
      <div className="hero-orbit hero-orbit--inner" aria-hidden="true"><i /><i /></div>
      <div className="hero-product-scan" aria-hidden="true" />

      <div className="hero-slide" key={product.id} aria-live="polite">
        <img
          className={`hero-carousel-image hero-carousel-image--${product.size}`}
          src={product.image}
          alt={product.name[lang]}
        />
      </div>

      <span className="hero-chip">{text.demo}</span>
      <div className="hero-product-caption">
        <span>{product.category[lang]}</span>
        <strong>{product.name[lang]}</strong>
        <small>{product.model[lang]}</small>
      </div>

      <button
        className="carousel-arrow carousel-arrow--previous"
        type="button"
        onClick={() => show(activeIndex - 1)}
        aria-label={lang === "zh" ? "上一款机器" : "Previous machine"}
      >
        <Icon name="previous" size={22} />
      </button>
      <button
        className="carousel-arrow carousel-arrow--next"
        type="button"
        onClick={() => show(activeIndex + 1)}
        aria-label={lang === "zh" ? "下一款机器" : "Next machine"}
      >
        <Icon name="next" size={22} />
      </button>

      <div className="carousel-dots" role="group" aria-label={lang === "zh" ? "选择机器款式" : "Choose a machine style"}>
        {heroProducts.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={index === activeIndex ? "is-active" : ""}
            aria-label={`${lang === "zh" ? "查看" : "View"} ${item.name[lang]}`}
            aria-current={index === activeIndex ? "true" : undefined}
            onClick={() => show(index)}
          >
            <span />
          </button>
        ))}
      </div>
    </div>
  );
}
