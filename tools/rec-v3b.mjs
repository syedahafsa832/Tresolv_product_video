import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';
import { installCursor, moveTo, sleep, state } from './rec-lib.mjs';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = 'http://localhost:5173';
const OUT = path.resolve('D:\\hack5\\hack5\\videos\\tresolv-demo\\media\\v3');

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 1 },
  args: ['--hide-scrollbars', '--force-color-profile=srgb', '--font-render-hinting=none'],
});
const page = await browser.newPage();
page.setDefaultTimeout(120000);

const waitForText = async (n, t = 90000) => {
  const t0 = Date.now();
  while (Date.now() - t0 < t) {
    if (await page.evaluate((x) => document.body.innerText.includes(x), n)) return true;
    await sleep(400);
  }
  return false;
};

await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2' });
await page.waitForSelector('input[type=email]');
await page.type('input[type=email]', process.env.TRESOLV_EMAIL, { delay: 12 });
await page.type('input[type=password]', process.env.TRESOLV_PASSWORD, { delay: 12 });
await page.click('button[type=submit]');
await sleep(9000);

// Warm, then record the real reply-review surface: a genuine AI answer built
// from this store's own catalogue, with the real approve/edit/reject controls.
await page.goto(`${BASE}/review`, { waitUntil: 'networkidle2' });
await waitForText('Review');
await sleep(3000);
await installCursor(page);

const rec = await page.screencast({ path: path.join(OUT, 'take3-breadth.webm'), fps: 30 });
state.x = 1500;
state.y = 220;
await moveTo(page, 1500, 220, { duration: 10 });
await sleep(1000);
await moveTo(page, 980, 470, { duration: 1200 }); // over the real grounded reply
await sleep(2600);
await moveTo(page, 470, 700, { duration: 1100 }); // over the real approve controls
await sleep(2600);
await rec.stop();
await browser.close();
console.log('take3', (fs.statSync(path.join(OUT, 'take3-breadth.webm')).size / 1024 / 1024).toFixed(1), 'MB');
