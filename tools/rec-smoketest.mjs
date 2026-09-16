import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';
import { installCursor, moveTo, clickAt, findByText, sleep, state } from './rec-lib.mjs';

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

await page.goto(`${BASE}/actions`, { waitUntil: 'networkidle2' });
await sleep(14000);
await installCursor(page);
page.on('framenavigated', () => installCursor(page).catch(() => {}));

const target = await findByText(page, 'View policy evidence');
console.log('target:', JSON.stringify(target));

const out = path.join(OUT, 'smoketest.webm');
const rec = await page.screencast({ path: out, fps: 30 });
state.x = 900; state.y = 240;
await moveTo(page, 760, 300, { duration: 800 });
await sleep(500);
if (target) {
  await moveTo(page, target.x, target.y, { duration: 1100 });
  await sleep(700); // hover state settles
  await clickAt(page, target.x, target.y); // safe, non-destructive disclosure toggle
  await sleep(1800);
}
await moveTo(page, 1100, 560, { duration: 900 });
await sleep(900);
await rec.stop();
await browser.close();

const sz = fs.statSync(out).size;
console.log('recorded:', out, (sz / 1024).toFixed(0), 'KB');
