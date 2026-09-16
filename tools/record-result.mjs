import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';
import { installCursor, moveTo, sleep, state } from './rec-lib.mjs';

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

await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2' });
await page.waitForSelector('input[type=email]');
await page.type('input[type=email]', process.env.TRESOLV_EMAIL, { delay: 15 });
await page.type('input[type=password]', process.env.TRESOLV_PASSWORD, { delay: 15 });
await Promise.all([page.click('button[type=submit]'), page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {})]);
await sleep(12000);

// Warm a fresh, real fetch of the post-cancellation state before recording.
await page.goto(`${BASE}/actions`, { waitUntil: 'networkidle2' });
await sleep(14000);
console.log('warm done — starting result recording');

// ── Recording starts on a genuine full reload — a real loading transition ──
const out = path.join(OUT, 'hero-take-02-result.webm');
const rec = await page.screencast({ path: out, fps: 30 });
await page.reload({ waitUntil: 'networkidle2' });
await sleep(9000); // real skeleton -> real populated state
await installCursor(page);
state.x = 800;
state.y = 80;
await moveTo(page, 800, 80, { duration: 10 });

// Read the real pending count + confirm #1011 is no longer in the pending list
const summary = await page.evaluate(() => {
  const body = document.body.innerText;
  const pendingHeader = /PENDING APPROVALS\s*\n?\s*(\d+)/.exec(body);
  return {
    pendingCount: pendingHeader ? pendingHeader[1] : null,
    still1011Pending: body.includes('Order #1011') && body.includes('Cancel in Shopify'),
    bodySnippet: body.slice(0, 400),
  };
});
console.log('post-reload summary:', JSON.stringify(summary));

// Move to the stats card, hold
await moveTo(page, 470, 130, { duration: 1100 });
await sleep(2200);

// Try to find a "Completed" disclosure that would show #1011 as executed
const completedToggle = await page.evaluate(() => {
  const els = [...document.querySelectorAll('*')].filter(
    (e) => /^Completed \(/.test((e.textContent || '').trim()) && e.children.length < 3
  );
  const t = els[0];
  if (!t) return null;
  const r = t.getBoundingClientRect();
  return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
});
console.log('completed toggle:', JSON.stringify(completedToggle));
if (completedToggle) {
  await moveTo(page, completedToggle.x, completedToggle.y, { duration: 900 });
  await sleep(500);
  await page.mouse.click(completedToggle.x, completedToggle.y);
  await sleep(2500);

  // Look for the #1011 row inside Completed and hover it
  const row1011 = await page.evaluate(() => {
    const cands = [...document.querySelectorAll('div')].filter(
      (d) => (d.textContent || '').includes('Order #1011') && d.textContent.length < 600
    );
    cands.sort((a, b) => a.textContent.length - b.textContent.length);
    const c = cands[0];
    if (!c) return null;
    const r = c.getBoundingClientRect();
    return { x: Math.round(r.x + r.width * 0.4), y: Math.round(r.y + r.height * 0.4), text: c.innerText.slice(0, 300) };
  });
  console.log('completed #1011 row:', JSON.stringify(row1011));
  if (row1011) {
    await moveTo(page, row1011.x, row1011.y, { duration: 1200 });
    await sleep(3200); // hold on the real result, silent
  } else {
    await sleep(2000);
  }
} else {
  await sleep(2000);
}

await sleep(1500);
await rec.stop();
await browser.close();

const sz = fs.statSync(out).size;
console.log('recorded:', out, (sz / 1024 / 1024).toFixed(1), 'MB');
