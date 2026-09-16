// Shared helpers for recording real, continuous interaction with the live UI.
// Every click/hover is a genuine CDP input event, so hover states, focus,
// loading states and transitions are the product's own. The only drawn element
// is the cursor sprite, which tracks the exact coordinates we dispatch.

export const CURSOR_CSS = `
#__demo_cursor {
  position: fixed; left: 0; top: 0; width: 26px; height: 26px;
  margin: -3px 0 0 -3px; pointer-events: none; z-index: 2147483647;
  transition: none; will-change: transform;
}
#__demo_cursor svg { display:block; filter: drop-shadow(0 2px 4px rgba(0,0,0,.35)); }
#__demo_ring {
  position: fixed; left:0; top:0; width: 46px; height: 46px; margin: -23px 0 0 -23px;
  border-radius: 50%; border: 2.5px solid rgba(14,176,196,.95);
  pointer-events: none; z-index: 2147483646; opacity: 0; transform: scale(.35);
}
`;

export const CURSOR_HTML = `
<div id="__demo_ring"></div>
<div id="__demo_cursor">
  <svg viewBox="0 0 24 24" width="26" height="26" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 2.5 L5 19.2 L9.2 15.3 L12.1 21.6 L15.1 20.2 L12.2 14 L18 13.6 Z"
          fill="#0a0a0a" stroke="#ffffff" stroke-width="1.4" stroke-linejoin="round"/>
  </svg>
</div>`;

export async function installCursor(page) {
  await page.evaluate(
    (css, html) => {
      if (document.getElementById('__demo_cursor')) return;
      const st = document.createElement('style');
      st.textContent = css;
      document.head.appendChild(st);
      const wrap = document.createElement('div');
      wrap.innerHTML = html;
      while (wrap.firstElementChild) document.body.appendChild(wrap.firstElementChild);
      window.__setCursor = (x, y) => {
        const c = document.getElementById('__demo_cursor');
        if (c) c.style.transform = `translate(${x}px, ${y}px)`;
      };
      window.__clickPulse = (x, y) => {
        const r = document.getElementById('__demo_ring');
        if (!r) return;
        r.style.transform = `translate(${x}px, ${y}px) scale(.35)`;
        r.style.opacity = '1';
        r.animate(
          [
            { transform: `translate(${x}px, ${y}px) scale(.35)`, opacity: 1 },
            { transform: `translate(${x}px, ${y}px) scale(1)`, opacity: 0 },
          ],
          { duration: 520, easing: 'cubic-bezier(.22,.61,.36,1)' }
        );
        setTimeout(() => { r.style.opacity = '0'; }, 520);
      };
    },
    CURSOR_CSS,
    CURSOR_HTML
  );
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// easeInOutCubic — human-ish acceleration, no robotic linear drift
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export const state = { x: 780, y: 520 };

export async function moveTo(page, x, y, { duration = 900, steps = 0 } = {}) {
  const n = steps || Math.max(18, Math.round(duration / 16));
  const x0 = state.x,
    y0 = state.y;
  // slight arc so the path isn't a dead straight line
  const bow = Math.min(46, Math.hypot(x - x0, y - y0) * 0.1);
  for (let i = 1; i <= n; i++) {
    const t = ease(i / n);
    const cx = x0 + (x - x0) * t;
    const cy = y0 + (y - y0) * t - Math.sin(Math.PI * (i / n)) * bow;
    await page.mouse.move(cx, cy);
    await page.evaluate((a, b) => window.__setCursor && window.__setCursor(a, b), cx, cy);
    await sleep(duration / n);
  }
  state.x = x;
  state.y = y;
}

export async function clickAt(page, x, y, { pause = 420 } = {}) {
  await sleep(pause); // beat before committing — reads as deliberate
  await page.evaluate((a, b) => window.__clickPulse && window.__clickPulse(a, b), x, y);
  await page.mouse.click(x, y, { delay: 70 });
}

export async function centerOf(page, selector) {
  return page.evaluate((sel) => {
    const el = [...document.querySelectorAll(sel)].find((e) => e.offsetParent !== null);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2), w: r.width, h: r.height };
  }, selector);
}

export async function findByText(page, text, tag = '*') {
  return page.evaluate(
    (t, g) => {
      const els = [...document.querySelectorAll(g)].filter(
        (e) => e.offsetParent !== null && (e.textContent || '').trim() === t && e.children.length === 0
      );
      const el = els[0] || [...document.querySelectorAll(g)].find(
        (e) => e.offsetParent !== null && (e.textContent || '').trim().includes(t) && e.children.length === 0
      );
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2), w: r.width, h: r.height };
    },
    text,
    tag
  );
}

export { sleep };
