import { useEffect, useRef } from "react";

const DESKTOP_DENSITY = 18000;
const MOBILE_DENSITY = 26000;

function createParticle(width, height, index) {
  const angle = (index * 2.399963) % (Math.PI * 2);
  const speed = 0.08 + (index % 5) * 0.025;
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius: index % 9 === 0 ? 1.8 : 0.8 + (index % 4) * 0.25,
    phase: Math.random() * Math.PI * 2,
  };
}

export default function ParticleField() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = canvas?.parentElement;
    if (!canvas || !container) return undefined;

    const context = canvas.getContext("2d", { alpha: true });
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarsePointer = window.matchMedia("(pointer: coarse)");
    let width = 0;
    let height = 0;
    let particles = [];
    let frame = 0;
    let running = true;
    const pointer = { x: 0, y: 0, active: false };

    function resize() {
      const rect = container.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      const density = coarsePointer.matches ? MOBILE_DENSITY : DESKTOP_DENSITY;
      const targetCount = Math.min(coarsePointer.matches ? 34 : 78, Math.max(20, Math.round((width * height) / density)));
      particles = Array.from({ length: targetCount }, (_, index) => createParticle(width, height, index));
      draw(performance.now(), false);
    }

    function draw(time, update = true) {
      context.clearRect(0, 0, width, height);
      const connectionDistance = coarsePointer.matches ? 92 : 124;

      particles.forEach((particle, index) => {
        if (update) {
          particle.x += particle.vx;
          particle.y += particle.vy;
          if (particle.x < -10) particle.x = width + 10;
          if (particle.x > width + 10) particle.x = -10;
          if (particle.y < -10) particle.y = height + 10;
          if (particle.y > height + 10) particle.y = -10;

          if (pointer.active && !coarsePointer.matches) {
            const dx = pointer.x - particle.x;
            const dy = pointer.y - particle.y;
            const distance = Math.hypot(dx, dy);
            if (distance > 1 && distance < 180) {
              const pull = (1 - distance / 180) * 0.012;
              particle.x += dx * pull;
              particle.y += dy * pull;
            }
          }
        }

        for (let otherIndex = index + 1; otherIndex < particles.length; otherIndex += 1) {
          const other = particles[otherIndex];
          const distance = Math.hypot(particle.x - other.x, particle.y - other.y);
          if (distance < connectionDistance) {
            const alpha = (1 - distance / connectionDistance) * 0.16;
            context.beginPath();
            context.moveTo(particle.x, particle.y);
            context.lineTo(other.x, other.y);
            context.strokeStyle = `rgba(117, 169, 255, ${alpha})`;
            context.lineWidth = 0.7;
            context.stroke();
          }
        }

        const pulse = 0.55 + Math.sin(time * 0.0012 + particle.phase) * 0.28;
        const glow = context.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, particle.radius * 4.5);
        glow.addColorStop(0, `rgba(197, 221, 255, ${0.85 * pulse})`);
        glow.addColorStop(0.28, `rgba(69, 132, 255, ${0.5 * pulse})`);
        glow.addColorStop(1, "rgba(21, 94, 239, 0)");
        context.beginPath();
        context.arc(particle.x, particle.y, particle.radius * 4.5, 0, Math.PI * 2);
        context.fillStyle = glow;
        context.fill();
      });
    }

    function animate(time) {
      if (!running) return;
      draw(time, true);
      frame = window.requestAnimationFrame(animate);
    }

    function start() {
      window.cancelAnimationFrame(frame);
      if (reducedMotion.matches || document.hidden) {
        draw(performance.now(), false);
        return;
      }
      frame = window.requestAnimationFrame(animate);
    }

    function onPointerMove(event) {
      const rect = container.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active = true;
    }

    function onPointerLeave() {
      pointer.active = false;
    }

    function onVisibilityChange() {
      start();
    }

    const observer = new ResizeObserver(resize);
    observer.observe(container);
    container.addEventListener("pointermove", onPointerMove, { passive: true });
    container.addEventListener("pointerleave", onPointerLeave);
    document.addEventListener("visibilitychange", onVisibilityChange);
    reducedMotion.addEventListener("change", start);
    resize();
    start();

    return () => {
      running = false;
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerleave", onPointerLeave);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      reducedMotion.removeEventListener("change", start);
    };
  }, []);

  return <canvas ref={canvasRef} className="particle-field" aria-hidden="true" />;
}
