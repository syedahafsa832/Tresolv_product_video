import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';
import { installCursor, moveTo, sleep, state } from './rec-lib.mjs';
import { ANON, ANON_LEAK_CHECK } from './anon.mjs';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'http://localhost:5173';
const OUT = path.resolve('D:/hack5/hack5/videos/tresolv-demo/media/v10');

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
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

await page.goto(`${BASE}/brands`, { waitUntil: 'networkidle2' });
await sleep(9000);
let n = await page.evaluate(ANON);
const leak = await page.evaluate(ANON_LEAK_CHECK);
console.log('brands substituted', n, JSON.stringify(leak));
if (leak.bad.length || leak.codersLeft) { console.error('LEAK'); await browser.close(); process.exit(1); }

await installCursor(page);
const rec = await page.screencast({ path: path.join(OUT, 'store.webm'), fps: 30 });
state.x = 1400; state.y = 520;
await moveTo(page, 1400, 520, { duration: 10 });
await sleep(700);
await moveTo(page, 1010, 235, { duration: 1600 });
await sleep(3800);
await rec.stop();
await browser.close();
console.log('store.webm', (fs.statSync(path.join(OUT, 'store.webm')).size / 1048576).toFixed(1), 'MB');
