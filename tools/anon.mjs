// Replaces real customer identifiers with stable demo ones IN THE LIVE DOM
// before capture. The product UI itself is untouched — only the strings that
// would be someone's real address or a leftover test account name.
//
// No interval loop here: a full-body TreeWalker on every tick starves the
// page's main thread on a long table and hangs the CDP protocol. Instead
// this installs a MutationObserver (cheap, catches normal React updates)
// and exposes `window.__anonSweep()` for the caller to invoke on demand
// right after an action that might have bypassed it (e.g. a big re-render).
export const ANON = `
(() => {
  // Realistic-looking demo addresses (still fake) instead of the visibly
  // synthetic @example.com pool — this is a controlled demo video, but the
  // UI should read as believable at a glance.
  const POOL = ['maya.larsen82@gmail.com','jonas.holm91@gmail.com','erik.b.andersen@gmail.com',
    'sofie.nielsen04@gmail.com','anna.moller77@gmail.com','tomas.rask19@gmail.com',
    'lina.karlsson88@gmail.com','peter.sorensen21@gmail.com','nadia.karim55@gmail.com',
    'oskar.winther33@gmail.com','clara.vinter09@gmail.com','henrik.dahl46@gmail.com'];
  const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}/g;
  const map = new Map();
  const pick = (s) => {
    if (!s.endsWith('@example.com') && POOL.includes(s)) return s;
    if (!map.has(s)) {
      let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
      let i = h % POOL.length, n = 0;
      const used = new Set(map.values());
      while (used.has(POOL[i]) && n++ < POOL.length) i = (i + 1) % POOL.length;
      map.set(s, POOL[i]);
    }
    return map.get(s);
  };
  const fix = (t) => t
    .replace(EMAIL, pick)
    .replace(/AI\\s*CODERS/gi, 'Nadia Karim')
    .replace(/aicoders/gi, 'nadia.k');
  const needsFix = (v) => v && (EMAIL.test(v) || /AI\\s*CODERS|aicoders/i.test(v));
  const sweep = (root) => {
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const hits = [];
    let node;
    while ((node = w.nextNode())) {
      const v = node.nodeValue;
      EMAIL.lastIndex = 0;
      if (needsFix(v)) hits.push(node);
      EMAIL.lastIndex = 0;
    }
    for (const n of hits) n.nodeValue = fix(n.nodeValue);
    return hits.length;
  };
  sweep(document.body);
  const mo = new MutationObserver((ms) => {
    for (const m of ms) {
      if (m.type === 'characterData') {
        const v = m.target.nodeValue;
        EMAIL.lastIndex = 0;
        if (needsFix(v)) m.target.nodeValue = fix(v);
        EMAIL.lastIndex = 0;
      }
      for (const n of m.addedNodes) {
        if (n.nodeType === 1) sweep(n);
        else if (n.nodeType === 3) {
          EMAIL.lastIndex = 0;
          if (needsFix(n.nodeValue)) n.nodeValue = fix(n.nodeValue);
          EMAIL.lastIndex = 0;
        }
      }
    }
  });
  mo.observe(document.body, { childList: true, subtree: true, characterData: true });
  window.__anonSweep = () => sweep(document.body);
  window.__anonCount = map.size;
  return map.size;
})()
`;

// Cheap check used by the capture script to abort before recording if
// anything real slipped through.
export const ANON_LEAK_CHECK = `
(() => {
  const SAFE = new Set(['maya.larsen82@gmail.com','jonas.holm91@gmail.com','erik.b.andersen@gmail.com',
    'sofie.nielsen04@gmail.com','anna.moller77@gmail.com','tomas.rask19@gmail.com',
    'lina.karlsson88@gmail.com','peter.sorensen21@gmail.com','nadia.karim55@gmail.com',
    'oskar.winther33@gmail.com','clara.vinter09@gmail.com','henrik.dahl46@gmail.com']);
  const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}/g;
  const t = document.body.innerText;
  const bad = (t.match(EMAIL) || []).filter((e) => !SAFE.has(e) && !/tresolv\\.myshopify|@example\\.com/.test(e));
  return { bad: [...new Set(bad)].slice(0, 5), codersLeft: /AI\\s*CODERS/i.test(t) };
})()
`;
