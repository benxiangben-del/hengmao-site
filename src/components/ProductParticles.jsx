import { useEffect, useRef } from "react";

const ASSEMBLY_TIME = 1350;
const REVEAL_TIME = 450;

function sampleImage(image, columns) {
  const buffer = document.createElement("canvas");
  buffer.width = columns;
  buffer.height = Math.max(1, Math.min(columns * 2, Math.round(columns * image.naturalHeight / image.naturalWidth)));
  const context = buffer.getContext("2d");
  if (!context) return [];
  context.drawImage(image, 0, 0, buffer.width, buffer.height);
  const { data } = context.getImageData(0, 0, buffer.width, buffer.height);
  const groups = new Map();

  for (let y = 0; y < buffer.height; y++) {
    for (let x = 0; x < buffer.width; x++) {
      const offset = (y * buffer.width + x) * 4;
      const [red, green, blue, alpha] = data.subarray(offset, offset + 4);
      if (alpha < 110) continue;

      const color = `rgb(${64 + (red >> 5) * 25}, ${90 + (green >> 5) * 22}, ${120 + (blue >> 5) * 18})`;
      if (!groups.has(color)) groups.set(color, []);

      const angle = Math.random() * Math.PI * 2;
      const distance = 18 + Math.random() * 125;
      groups.get(color).push({
        u: (x + Math.random()) / buffer.width,
        v: (y + Math.random()) / buffer.height,
        dx: Math.cos(angle) * distance,
        dy: Math.sin(angle) * distance * .68,
        depth: Math.random() * 2 - 1,
        size: .75 + Math.random() * 1.05,
      });
    }
  }

  return groups;
}

export default function ProductParticles({ image }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = canvas.parentElement;
    const photo = stage.querySelector(".hero-slide.is-active img");
    const context = canvas.getContext("2d");
    if (!context || !photo) return undefined;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobile = window.matchMedia("(max-width: 820px), (pointer: coarse)");
    let groups;
    let frame = 0;
    let start = 0;
    let hover = 0;
    let geometry;
    let pointer = null;
    let lastDraw = -Infinity;

    function measure() {
      const stageRect = stage.getBoundingClientRect();
      const imageRect = photo.getBoundingClientRect();
      const scale = Math.min(imageRect.width / photo.naturalWidth, imageRect.height / photo.naturalHeight);
      const width = photo.naturalWidth * scale;
      const height = photo.naturalHeight * scale;
      const dpr = Math.min(window.devicePixelRatio || 1, mobile.matches ? 1 : 1.5);
      canvas.width = Math.round(stageRect.width * dpr);
      canvas.height = Math.round(stageRect.height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      geometry = {
        canvasWidth: stageRect.width,
        canvasHeight: stageRect.height,
        width,
        height,
        left: imageRect.left - stageRect.left + (imageRect.width - width) / 2,
        top: imageRect.top - stageRect.top + (imageRect.height - height) / 2,
      };
    }

    function schedule() {
      if (!frame && !document.hidden && !reduced.matches) frame = requestAnimationFrame(draw);
    }

    function draw(now) {
      frame = 0;
      if (!geometry || reduced.matches) return;
      if (mobile.matches && now - lastDraw < 28) {
        schedule();
        return;
      }
      lastDraw = now;
      const progress = Math.min(1, (now - start) / ASSEMBLY_TIME);
      const drift = (1 - progress) ** 2;
      const handoff = Math.min(1, Math.max(0, (now - start - ASSEMBLY_TIME) / REVEAL_TIME));
      const target = pointer ? 1 : 0;
      hover += (target - hover) * .16;
      if (Math.abs(hover - target) < .015) hover = target;
      const photoOpacity = handoff * (1 - hover * .94);
      const cloudOpacity = 1 - photoOpacity;
      photo.style.opacity = String(photoOpacity);
      canvas.style.opacity = String(cloudOpacity);
      const { canvasWidth, canvasHeight, width, height, left, top } = geometry;
      context.clearRect(0, 0, canvasWidth, canvasHeight);
      if (cloudOpacity > .015) {
        for (const [color, points] of groups) {
          context.fillStyle = color;
          for (const point of points) {
            let x = left + point.u * width + point.dx * drift;
            let y = top + point.v * height + point.dy * drift;
            x += Math.sin(now * .003 + point.v * 14) * point.depth * (pointer ? 3 : 16 * drift);
            if (pointer) {
              const dx = x - pointer.x;
              const dy = y - pointer.y;
              const distance = Math.hypot(dx, dy);
              if (distance > 0 && distance < 90) {
                const push = (1 - distance / 90) * 38 / distance;
                x += dx * push;
                y += dy * push;
              }
            }
            context.fillRect(x, y, point.size, point.size);
          }
        }
      }
      if (pointer || handoff < 1 || hover > 0) schedule();
    }

    function reset() {
      cancelAnimationFrame(frame);
      frame = 0;
      groups = undefined;
      pointer = null;
      canvas.style.opacity = "0";
      photo.style.opacity = "";
      if (reduced.matches || !photo.naturalWidth) return;
      try {
        groups = sampleImage(photo, mobile.matches ? 68 : 118);
      } catch {
        // Cross-origin product photos can still display without pixel sampling.
        return;
      }
      if (!groups.size) return;
      measure();
      start = performance.now();
      hover = 0;
      lastDraw = -Infinity;
      draw(start);
    }

    function move(event) {
      if (!groups?.size || mobile.matches || reduced.matches) return;
      const rect = stage.getBoundingClientRect();
      pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      schedule();
    }

    function leave() {
      pointer = null;
      if (groups?.size) schedule();
    }

    const observer = new ResizeObserver(() => {
      if (groups?.size) {
        measure();
        schedule();
      }
    });
    observer.observe(stage);
    photo.addEventListener("load", reset);
    stage.addEventListener("pointermove", move, { passive: true });
    stage.addEventListener("pointerleave", leave);
    reduced.addEventListener("change", reset);
    mobile.addEventListener("change", reset);
    document.addEventListener("visibilitychange", leave);
    if (photo.complete) reset();

    return () => {
      cancelAnimationFrame(frame);
      photo.style.opacity = "";
      observer.disconnect();
      photo.removeEventListener("load", reset);
      stage.removeEventListener("pointermove", move);
      stage.removeEventListener("pointerleave", leave);
      reduced.removeEventListener("change", reset);
      mobile.removeEventListener("change", reset);
      document.removeEventListener("visibilitychange", leave);
    };
  }, [image]);

  return <canvas ref={canvasRef} className="hero-product-particles" aria-hidden="true" />;
}
