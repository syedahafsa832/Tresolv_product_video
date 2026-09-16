import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';
import { installCursor, moveTo, sleep, state } from './rec-lib.mjs';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'http://localhost:5173';
const OUT = path.resolve('D:/hack5/hack5/videos/tresolv-demo/media/v8');
const W = 3840, H = 2160;

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  defaultViewport: { width: W, height: H, deviceScaleFactor: 1 },
  args: ['--hide-scrollbars', '--force-color-profile=srgb', '--font-render-hinting=none'],
});
const page = await browser.newPage();
page.setDefaultTimeout(120000);
await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2' });
await page.waitForSelector('input[type=email]');
await page.type('input[type=email]', process.env.TRESOLV_EMAIL, { delay: 10 });
await page.type('input[type=password]', process.env.TRESOLV_PASSWORD, { delay: 10 });
await page.click('button[type=submit]');
await page.waitForFunction(() => !location.pathname.includes('login'), { timeout: 90000 });
await sleep(6000);
await page.goto(`${BASE}/tickets`, { waitUntil: 'networkidle2' });
await sleep(11000);

const cols = await page.evaluate(() => {
  const tr = document.querySelector('tbody tr');
  const head = [...document.querySelectorAll('thead th')].map((t) => t.innerText.trim());
  if (!tr) return { head, cells: null };
  return {
    head,
    cells: [...tr.children].map((td) => {
      const r = td.getBoundingClientRect();
      return { t: td.innerText.trim().slice(0, 28), x: Math.round(r.x), r: Math.round(r.right) };
    }),
  };
});
console.log(JSON.stringify(cols, null, 1));
await page.screenshot({ path: path.join(OUT, 'wide-tickets.png') });

await page.evaluate(() => { const m = document.querySelector('main'); if (m) m.scrollTo({ top: 0, behavior: 'instant' }); });
await sleep(1000);
await installCursor(page);
const scrollMain = (d) => page.evaluate((px) => {
  const m = document.querySelector('main'); if (m) m.scrollBy({ top: px, behavior: 'smooth' });
}, d);
const rec = await page.screencast({ path: path.join(OUT, 'breadth-wide.webm'), fps: 30 });
state.x = 3100; state.y = 1300;
await moveTo(page, 3100, 1300, { duration: 10 });
await sleep(1500);
await scrollMain(380); await sleep(1800);
await scrollMain(420); await sleep(1800);
await scrollMain(400); await sleep(1800);
await scrollMain(440); await sleep(2600);
await rec.stop();
await browser.close();
console.log('breadth-wide', (fs.statSync(path.join(OUT, 'breadth-wide.webm')).size / 1048576).toFixed(1), 'MB');
