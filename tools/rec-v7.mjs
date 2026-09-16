import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';
import { installCursor, moveTo, clickAt, sleep, state } from './rec-lib.mjs';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = 'http://localhost:5173';
const OUT = path.resolve('D:\\hack5\\hack5\\videos\\tresolv-demo\\media\\v6');
fs.mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 1 },
  args: ['--hide-scrollbars', '--force-color-profile=srgb', '--font-render-hinting=none'],
});
const page = await browser.newPage();
page.setDefaultTimeout(120000);

await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2' });
await page.waitForSelector('input[type=email]');
await page.type('input[type=email]', process.env.TRESOLV_EMAIL, { delay: 10 });
await page.type('input[type=password]', process.env.TRESOLV_PASSWORD, { delay: 10 });
await page.click('button[type=submit]');
await sleep(9000);

// ══ CLIP A — the real completed result for #1012 ══════════════════════
await page.goto(`${BASE}/actions`, { waitUntil: 'networkidle2' });
await sleep(7500);

// Put the Completed disclosure on screen before recording starts
await page.evaluate(() => {
  const main = document.querySelector('main');
  const el = [...document.querySelectorAll('*')].find(
    (e) => /^[▸▾]?\s*Completed \(/.test((e.textContent || '').trim()) && e.children.length < 4
  );
  if (el && main) main.scrollTo({ top: el.getBoundingClientRect().top + main.scrollTop - 300, behavior: 'instant' });
});
await sleep(1500);
await installCursor(page);

const box = await page.evaluate(() => {
  const el = [...document.querySelectorAll('*')].find(
    (e) => /^[▸▾]?\s*Completed \(/.test((e.textContent || '').trim()) && e.children.length < 4
  );
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: Math.round(r.x + 50), y: Math.round(r.y + r.height / 2) };
});
console.log('completed toggle:', JSON.stringify(box));

let rec = await page.screencast({ path: path.join(OUT, 'proof.webm'), fps: 30 });
state.x = box ? box.x + 520 : 900;
state.y = box ? box.y - 190 : 300;
await moveTo(page, state.x, state.y, { duration: 10 });
await sleep(450);
if (box) {
  await moveTo(page, box.x, box.y, { duration: 750 });
  await sleep(300);
  await clickAt(page, box.x, box.y, { pause: 200 });
  await sleep(3400); // the executed rows render and are read
}
await rec.stop();
const ok = await page.evaluate(() => document.body.innerText.includes('Order #1012 cancelled'));
console.log('proof captured, result line present:', ok);

// ══ CLIP B — purposeful scroll through the varied real inbox ══════════
await page.goto(`${BASE}/tickets`, { waitUntil: 'networkidle2' });
await sleep(8000);
await installCursor(page);

const scrollMain = (px) =>
  page.evaluate((d) => {
    const m = document.querySelector('main');
    if (m) m.scrollBy({ top: d, behavior: 'smooth' });
  }, px);

rec = await page.screencast({ path: path.join(OUT, 'inbox-scroll.webm'), fps: 30 });
state.x = 1480; state.y = 320;
await moveTo(page, 1480, 320, { duration: 10 });
await sleep(800);
await scrollMain(300);
await sleep(1500);
await scrollMain(340);
await sleep(1500);
await scrollMain(320);
await sleep(1800);
await rec.stop();
console.log('inbox-scroll captured');

await browser.close();
for (const f of ['proof.webm', 'inbox-scroll.webm']) {
  console.log(f, (fs.statSync(path.join(OUT, f)).size / 1024 / 1024).toFixed(1), 'MB');
}
