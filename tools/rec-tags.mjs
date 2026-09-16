import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';
import { installCursor, moveTo, clickAt, sleep, state } from './rec-lib.mjs';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = 'http://localhost:5173';
const OUT = path.resolve('D:\\hack5\\hack5\\videos\\tresolv-demo\\media\\v6');

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 1 },
  args: ['--hide-scrollbars', '--force-color-profile=srgb'],
});
const page = await browser.newPage();
page.setDefaultTimeout(120000);
await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2' });
await page.waitForSelector('input[type=email]');
await page.type('input[type=email]', process.env.TRESOLV_EMAIL, { delay: 10 });
await page.type('input[type=password]', process.env.TRESOLV_PASSWORD, { delay: 10 });
await page.click('button[type=submit]');
await sleep(9000);
await page.goto(`${BASE}/tickets`, { waitUntil: 'networkidle2' });
await sleep(8000);

// Apply a real tag filter so the list shows one clear support category.
const sel = await page.evaluate(() => {
  const s = [...document.querySelectorAll('select')].find((e) =>
    [...e.options].some((o) => /exchange|refund|shipping/i.test(o.textContent || ''))
  );
  if (!s) return null;
  const r = s.getBoundingClientRect();
  return {
    x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2),
    options: [...s.options].map((o) => o.textContent.trim()),
  };
});
console.log('tag select:', JSON.stringify(sel));
if (!sel) { await browser.close(); process.exit(0); }

await installCursor(page);
const rec = await page.screencast({ path: path.join(OUT, 'tagfilter4.webm'), fps: 30 });
state.x = sel.x + 420; state.y = sel.y + 160;
await moveTo(page, state.x, state.y, { duration: 10 });
await sleep(500);
await moveTo(page, sel.x, sel.y, { duration: 750 });
await sleep(400);

// Choose a category with clean, on-brand results
for (const want of ['Question']) {
  const changed = await page.evaluate((w) => {
    const s = [...document.querySelectorAll('select')].find((e) =>
      [...e.options].some((o) => /exchange|refund|shipping/i.test(o.textContent || ''))
    );
    const opt = [...s.options].find((o) => o.textContent.trim() === w);
    if (!opt) return false;
    s.value = opt.value;
    s.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }, want);
  if (changed) { console.log('applied filter:', want); break; }
}
await sleep(1400);
await page.evaluate(() => { const m=document.querySelector('main'); if(m) m.scrollBy({top:520,behavior:'smooth'}); });
await sleep(1500);
await page.evaluate(() => { const m=document.querySelector('main'); if(m) m.scrollBy({top:180,behavior:'smooth'}); });
await sleep(2600);
await rec.stop();
const txt = await page.evaluate(() => document.body.innerText.slice(0, 700));
console.log('--- filtered list ---\n', txt);
await page.screenshot({ path: path.join(OUT, 'tagfilter4.png') });
await browser.close();
console.log('size', (fs.statSync(path.join(OUT, 'tagfilter4.webm')).size / 1024 / 1024).toFixed(1), 'MB');
