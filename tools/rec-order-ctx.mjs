import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';
import { installCursor, moveTo, sleep, state } from './rec-lib.mjs';
import { ANON, ANON_LEAK_CHECK } from './anon.mjs';

const BASE = 'http://localhost:5173';
const TID = 'a3702b43-1f0e-49a1-b649-9f2bc8d99a9f';
const OUT = path.resolve('D:/hack5/hack5/videos/tresolv-demo/media/v12');
fs.mkdirSync(OUT, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new',
  defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 1 },
  args: ['--hide-scrollbars', '--force-color-profile=srgb', '--font-render-hinting=none'],
  protocolTimeout: 240000,
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
await page.goto(`${BASE}/tickets/${TID}`, { waitUntil: 'networkidle2' });
await sleep(14000);

let n = await page.evaluate(ANON);
if (n === 0) { await sleep(2500); n = await page.evaluate(ANON); }
const leak = await page.evaluate(ANON_LEAK_CHECK);
console.log('substituted', n, JSON.stringify(leak));
if (leak.bad.length || leak.codersLeft) { console.error('LEAK'); await browser.close(); process.exit(1); }

const has = await page.evaluate(() => ({
  hasOrderContext: document.body.innerText.includes('Order Context'),
  hasTracking: document.body.innerText.includes('Tracking'),
  snippet: document.body.innerText.slice(0, 300),
}));
console.log('page check:', JSON.stringify(has));
if (!has.hasOrderContext) { console.error('ABORT: no Order Context panel'); await browser.close(); process.exit(1); }

await installCursor(page);
const rec = await page.screencast({ path: path.join(OUT, 'order-ctx.webm'), fps: 30 });
state.x = 1400; state.y = 300;
await moveTo(page, 1400, 300, { duration: 8 });
await sleep(500);
await moveTo(page, 1500, 500, { duration: 1400 });
await sleep(4200);
await rec.stop();
await browser.close();
console.log('order-ctx.webm', (fs.statSync(path.join(OUT, 'order-ctx.webm')).size / 1048576).toFixed(1), 'MB');
