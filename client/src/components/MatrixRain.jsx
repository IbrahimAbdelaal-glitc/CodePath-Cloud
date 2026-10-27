import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useReducedMotion } from '../lib/useReducedMotion.js';

// Animated "digital rain" drawn on two canvases behind the whole interface:
// a far layer (smaller, dim, blurred by CSS) and a near layer (larger, brighter glyphs with glowing heads),
// which gives the depth-of-field look of the reference photo. Purely decorative: aria-hidden and pointer-events: none.
// It is not shown while studying (course pages, lessons and quizzes), so nothing moves behind a video or question.
// Animation stops when the device asks for reduced motion or the tab is hidden; a still frame remains.
const GLYPHS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789ABCDEFZ:=*+<>¦｜ÉÂÔÑØ#$%&';
const FPS = 24;

function makeLayer(canvas, { size, speed, fade, headAlpha, bodyAlpha, density }) {
  const ctx = canvas.getContext('2d');
  let columns = [];
  let w = 0;
  let h = 0;

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.font = `${size}px "JetBrains Mono", Consolas, monospace`;
    ctx.textBaseline = 'top';
    const count = Math.ceil(w / size);
    columns = Array.from({ length: count }, () => ({
      y: Math.random() * -h,
      speed: speed * (0.6 + Math.random() * 0.8),
      active: Math.random() < density,
    }));
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
  };

  const step = () => {
    // Translucent black wash leaves fading trails behind each falling head
    ctx.fillStyle = `rgba(0, 0, 0, ${fade})`;
    ctx.fillRect(0, 0, w, h);
    columns.forEach((col, i) => {
      if (!col.active) {
        if (Math.random() < 0.002) col.active = true;
        return;
      }
      const x = i * size;
      const ch = GLYPHS[(Math.random() * GLYPHS.length) | 0];
      ctx.fillStyle = `rgba(40, 255, 120, ${bodyAlpha})`;
      ctx.fillText(GLYPHS[(Math.random() * GLYPHS.length) | 0], x, col.y - size);
      ctx.fillStyle = `rgba(200, 255, 220, ${headAlpha})`;
      ctx.fillText(ch, x, col.y);
      col.y += col.speed;
      if (col.y > h + size * 4) {
        col.y = Math.random() * -h * 0.5;
        col.speed = speed * (0.6 + Math.random() * 0.8);
        col.active = Math.random() < density;
      }
    });
  };

  // A static scatter of glyphs for reduced motion
  const still = () => {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    columns.forEach((col, i) => {
      if (!col.active) return;
      const len = 4 + ((Math.random() * 18) | 0);
      const start = Math.random() * h;
      for (let k = 0; k < len; k++) {
        ctx.fillStyle = `rgba(40, 255, 120, ${(bodyAlpha * (k + 1)) / len})`;
        ctx.fillText(GLYPHS[(Math.random() * GLYPHS.length) | 0], i * size, start + k * size);
      }
    });
  };

  return { resize, step, still };
}

// Course pages (/learn/...), lessons (/lessons/...) and block quizzes (/learn/.../quiz/...)
const STUDY_PATHS = /^\/(learn|lessons)\//;

export default function MatrixRain() {
  const { pathname } = useLocation();
  return STUDY_PATHS.test(pathname) ? null : <Rain />;
}

function Rain() {
  const farRef = useRef(null);
  const nearRef = useRef(null);
  const animate = !useReducedMotion();

  useEffect(() => {
    const far = makeLayer(farRef.current, { size: 13, speed: 3.2, fade: 0.055, headAlpha: 0.6, bodyAlpha: 0.4, density: 0.95 });
    const near = makeLayer(nearRef.current, { size: 20, speed: 5, fade: 0.07, headAlpha: 0.95, bodyAlpha: 0.65, density: 0.6 });
    const layers = [far, near];
    let raf = 0;
    let last = 0;

    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      if (now - last < 1000 / FPS) return;
      last = now;
      layers.forEach((l) => l.step());
    };
    const start = () => {
      cancelAnimationFrame(raf);
      if (animate && document.visibilityState === 'visible') raf = requestAnimationFrame(loop);
    };
    const reset = () => {
      layers.forEach((l) => l.resize());
      if (!animate) layers.forEach((l) => l.still());
    };

    reset();
    start();
    let resizeTimer;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(reset, 150);
    };
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', start);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', start);
    };
  }, [animate]);

  return (
    <div className="matrix-rain" aria-hidden="true">
      <canvas ref={farRef} className="matrix-rain__far" />
      <canvas ref={nearRef} className="matrix-rain__near" />
      <div className="matrix-rain__veil" />
    </div>
  );
}
