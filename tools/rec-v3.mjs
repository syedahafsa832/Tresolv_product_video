import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';
import { installCursor, moveTo, clickAt, sleep, state } from './rec-lib.mjs';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = 'http://localhost:5173';
const OUT = path.resolve('D:\\hack5\\hack5\\videos\\tresolv-demo\\media\\v3');
fs.mkdirSync(OUT, { recursive: true });

const ORDER = '#1012';
const TICKET_HINT = 'syeda.hafsa@example.com';

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 1 },
  args: ['--hide-scrollbars', '--force-color-profile=srgb', '--font-render-hinting=none'],
});
const page = await browser.newPage();
page.setDefaultTimeout(120000);

// Wait until real content is on screen — never waitForNavigation (SPA routing
// never fires it, which cost ~90s of dead air per click last time).
const waitForText = async (needle, timeout = 90000) => {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    const ok = await page.evaluate((n) => document.body.innerText.includes(n), needle);
    if (ok) return true;
    await sleep(400);
  }
  console.log(`  !! timed out waiting for "${needle}"`);
  return false;
};

await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2' });
await page.waitForSelector('input[type=email]');
await page.type('input[type=email]', process.env.TRESOLV_EMAIL, { delay: 12 });
await page.type('input[type=password]', process.env.TRESOLV_PASSWORD, { delay: 12 });
await page.click('button[type=submit]');
await waitForText('Dashboard Overview', 60000).catch(() => {});
await sleep(6000);

// Warm both routes so the recorded pass hits populated data fast.
await page.goto(`${BASE}/tickets`, { waitUntil: 'networkidle2' });
await waitForText('CHANNEL');
await page.goto(`${BASE}/actions`, { waitUntil: 'networkidle2' });
await waitForText(`Order ${ORDER}`);
console.log('warm complete');

const center = (sel, scope) =>
  page.evaluate(
    (s, sc) => {
      const root = sc
        ? [...document.querySelectorAll('div')]
            .filter((d) => (d.textContent || '').includes(sc) && (d.textContent || '').includes('Cancel in Shopify'))
            .sort((a, b) => a.textContent.length - b.textContent.length)[0]
        : document;
      if (!root) return null;
      const el = [...root.querySelectorAll(s)].find((e) => e.offsetParent !== null);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
    },
    sel,
    scope
  );

const byText = (txt, scope) =>
  page.evaluate(
    (t, sc) => {
      const root = sc
        ? [...document.querySelectorAll('div')]
            .filter((d) => (d.textContent || '').includes(sc) && (d.textContent || '').includes('Cancel in Shopify'))
            .sort((a, b) => a.textContent.length - b.textContent.length)[0]
        : document.body;
      if (!root) return null;
      const el = [...root.querySelectorAll('button,a,span,div')].find(
        (e) => e.offsetParent !== null && (e.textContent || '').trim().replace(/^▸\s*/, '') === t
      );
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
    },
    txt,
    scope
  );

// ══════════ TAKE 1 — the request arrives, agent opens it ══════════
await page.goto(`${BASE}/tickets`, { waitUntil: 'networkidle2' });
await waitForText('CHANNEL');
await sleep(2500);
await installCursor(page);

let rec = await page.screencast({ path: path.join(OUT, 'take1-open.webm'), fps: 30 });
state.x = 1180;
state.y = 120;
await moveTo(page, 1180, 120, { duration: 10 });
await sleep(700);

const row = await page.evaluate((hint) => {
  const tr = [...document.querySelectorAll('tr')].find((r) => (r.textContent || '').includes(hint));
  if (!tr) return null;
  const rect = tr.getBoundingClientRect();
  return { x: Math.round(rect.x + 300), y: Math.round(rect.y + rect.height / 2) };
}, TICKET_HINT);
console.log('take1 row:', JSON.stringify(row));

if (row) {
  await moveTo(page, row.x, row.y, { duration: 1000 });
  await sleep(650); // hover state reads
  await clickAt(page, row.x, row.y, { pause: 320 });
  await waitForText('Conversation Replay', 40000);
  await installCursor(page);
  await sleep(2600); // real request + reply on screen
}
await rec.stop();
console.log('take1 done');

// ══════════ TAKE 2 — the hero: policy, approve, real change ══════════
await page.goto(`${BASE}/actions`, { waitUntil: 'networkidle2' });
await waitForText(`Order ${ORDER}`);
await sleep(2500);
await installCursor(page);

rec = await page.screencast({ path: path.join(OUT, 'take2-approve.webm'), fps: 30 });
state.x = 1500;
state.y = 200;
await moveTo(page, 1500, 200, { duration: 10 });
await sleep(900); // card is on screen, let it read

// 1 · open the real policy evidence
const toggle = await byText('View policy evidence', ORDER);
console.log('toggle:', JSON.stringify(toggle));
if (toggle) {
  await moveTo(page, toggle.x, toggle.y, { duration: 950 });
  await sleep(420);
  await clickAt(page, toggle.x, toggle.y, { pause: 260 });
  await sleep(2400); // real evidence panel reads
}

// 2 · approach and commit
const btn = await byText('Cancel in Shopify', ORDER);
console.log('button:', JSON.stringify(btn));
if (btn) {
  await moveTo(page, btn.x, btn.y, { duration: 1050 });
  await sleep(950); // the beat before a real, irreversible action
  await clickAt(page, btn.x, btn.y, { pause: 300 });
  console.log('CLICKED — real cancellation firing for', ORDER);
  await sleep(7000); // real Processing… state
}

// 3 · real reload -> the real resulting queue
await page.reload({ waitUntil: 'networkidle2' });
await waitForText('Pending Approvals', 60000);
await sleep(1200);
await installCursor(page);
state.x = 960;
state.y = 300;
await moveTo(page, 470, 190, { duration: 1100 }); // to the pending-approvals count
await sleep(3200); // hold on the real result
await rec.stop();
console.log('take2 done');

await browser.close();
for (const f of ['take1-open.webm', 'take2-approve.webm']) {
  const p = path.join(OUT, f);
  console.log(f, (fs.statSync(p).size / 1024 / 1024).toFixed(1), 'MB');
}
