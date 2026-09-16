import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';
import { installCursor, moveTo, clickAt, findByText, centerOf, sleep, state } from './rec-lib.mjs';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = 'http://localhost:5173';
const OUT = path.resolve('D:\\hack5\\hack5\\videos\\tresolv-demo\\media\\footage');
fs.mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  defaultViewport: { width: 1600, height: 900, deviceScaleFactor: 1 },
  args: ['--hide-scrollbars', '--force-color-profile=srgb'],
});
const page = await browser.newPage();
page.setDefaultTimeout(90000);

// ── Login (not recorded) ───────────────────────────────────────────────
await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2' });
await page.waitForSelector('input[type=email]');
await page.type('input[type=email]', process.env.TRESOLV_EMAIL, { delay: 15 });
await page.type('input[type=password]', process.env.TRESOLV_PASSWORD, { delay: 15 });
await Promise.all([page.click('button[type=submit]'), page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {})]);
await sleep(12000);

// Preload the two pages we'll visit so data is warm before recording starts.
await page.goto(`${BASE}/tickets`, { waitUntil: 'networkidle2' });
await sleep(13000);
await page.goto(`${BASE}/actions`, { waitUntil: 'networkidle2' });
await sleep(14000);
console.log('warm — starting recording');

// ── Recording starts here ──────────────────────────────────────────────
await page.goto(`${BASE}/tickets`, { waitUntil: 'networkidle2' });
await sleep(13000);
await installCursor(page);
page.on('framenavigated', () => { installCursor(page).catch(() => {}); });

const out = path.join(OUT, 'hero-take-01.webm');
const rec = await page.screencast({ path: out, fps: 30 });
state.x = 820;
state.y = 60;
await moveTo(page, 820, 60, { duration: 10 });

// Find the #1011 chat row (SENDER = syeda.hafsa@example.com, most recent)
let row = await centerOf(page, '#__nope'); // placeholder, real lookup below
row = await page.evaluate(() => {
  const rows = [...document.querySelectorAll('tr')];
  let r = rows.find((tr) => (tr.textContent || '').includes('fb357a7f'));
  if (!r) r = rows.find((tr) => (tr.textContent || '').includes('syeda.hafsa@example.com'));
  if (!r) return null;
  const rect = r.getBoundingClientRect();
  return { x: Math.round(rect.x + 160), y: Math.round(rect.y + rect.height / 2) };
});
console.log('inbox row:', JSON.stringify(row));

if (row) {
  await sleep(600);
  await moveTo(page, row.x, row.y, { duration: 1300 });
  await sleep(750); // hover, let the row read
  await clickAt(page, row.x, row.y);
  await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
  await sleep(9000); // real ticket detail load
  await installCursor(page);
  state.x = row.x;
  state.y = row.y;
  await moveTo(page, 700, 420, { duration: 1400 }); // settle over the conversation
  await sleep(2400); // let the real request + reply be read
}

// ── Move to Escalations (same continuous take) ─────────────────────────
await moveTo(page, 60, 220, { duration: 1000 }); // toward the "Escalations" nav item
await sleep(300);
const navTarget = await findByText(page, 'Escalations', 'span,a,div');
if (navTarget) {
  await moveTo(page, navTarget.x, navTarget.y, { duration: 900 });
  await sleep(500);
  await clickAt(page, navTarget.x, navTarget.y);
} else {
  await page.goto(`${BASE}/actions`, { waitUntil: 'networkidle2' });
}
await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
await sleep(10000);
await installCursor(page);

// Locate the #1011 card region
const card = await page.evaluate(() => {
  const cands = [...document.querySelectorAll('div')].filter(
    (d) => (d.textContent || '').includes('Order #1011') && (d.textContent || '').includes('Cancel in Shopify')
  );
  cands.sort((a, b) => a.textContent.length - b.textContent.length);
  const c = cands[0];
  if (!c) return null;
  const r = c.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
});
console.log('card rect:', JSON.stringify(card));

if (card) {
  state.x = 800;
  state.y = 100;
  const readX = card.left + card.width * 0.42;
  const readY = card.top + card.height * 0.28;
  await moveTo(page, readX, readY, { duration: 1300 });
  await sleep(2200); // let the real request text be read

  // Real "View policy evidence" toggle for this exact card
  const toggle = await page.evaluate(() => {
    const cands = [...document.querySelectorAll('div')].filter(
      (d) => (d.textContent || '').includes('Order #1011') && (d.textContent || '').includes('Cancel in Shopify')
    );
    cands.sort((a, b) => a.textContent.length - b.textContent.length);
    const c = cands[0];
    if (!c) return null;
    const t = [...c.querySelectorAll('button,div,span,a')].find((e) =>
      (e.textContent || '').trim().replace(/^▸\s*/, '') === 'View policy evidence'
    );
    if (!t) return null;
    const r = t.getBoundingClientRect();
    return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
  });
  console.log('policy toggle:', JSON.stringify(toggle));
  if (toggle) {
    await moveTo(page, toggle.x, toggle.y, { duration: 900 });
    await sleep(500);
    await clickAt(page, toggle.x, toggle.y);
    await sleep(1900); // let the revealed evidence render + be read
  }

  // Real "Cancel in Shopify" button for this exact card
  const btn = await page.evaluate(() => {
    const cands = [...document.querySelectorAll('div')].filter(
      (d) => (d.textContent || '').includes('Order #1011') && (d.textContent || '').includes('Cancel in Shopify')
    );
    cands.sort((a, b) => a.textContent.length - b.textContent.length);
    const c = cands[0];
    if (!c) return null;
    const b = [...c.querySelectorAll('button')].find((e) => (e.textContent || '').trim() === 'Cancel in Shopify');
    if (!b) return null;
    const r = b.getBoundingClientRect();
    return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
  });
  console.log('cancel button:', JSON.stringify(btn));

  if (btn) {
    await moveTo(page, btn.x, btn.y, { duration: 1100 });
    await sleep(900); // deliberate pause before the real, irreversible click
    if (process.env.DRY_RUN === '1') {
      console.log('DRY RUN — target found, NOT clicking:', JSON.stringify(btn));
    } else {
      await clickAt(page, btn.x, btn.y);
      console.log('CLICKED CANCEL IN SHOPIFY — real mutation firing now');
      await sleep(9000); // real loading -> real resulting state
    }
  }
}

await sleep(2500);
await rec.stop();
await browser.close();

const sz = fs.statSync(out).size;
console.log('recorded:', out, (sz / 1024 / 1024).toFixed(1), 'MB');
