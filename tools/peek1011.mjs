import puppeteer from 'puppeteer-core';
import path from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = 'http://localhost:5173';
const OUT = path.resolve('D:\\hack5\\hack5\\videos\\tresolv-demo\\.review3');
const settle = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  defaultViewport: { width: 1600, height: 900, deviceScaleFactor: 2 },
  args: ['--hide-scrollbars'],
});
const page = await browser.newPage();
page.setDefaultTimeout(90000);

await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2' });
await page.waitForSelector('input[type=email]');
await page.type('input[type=email]', process.env.TRESOLV_EMAIL, { delay: 15 });
await page.type('input[type=password]', process.env.TRESOLV_PASSWORD, { delay: 15 });
await Promise.all([page.click('button[type=submit]'), page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {})]);
await settle(12000);

await page.goto(`${BASE}/tickets/fb357a7f-2e91-44e4-8b23-b9158f423298`, { waitUntil: 'networkidle2' });
await settle(14000);
await page.screenshot({ path: path.join(OUT, 'peek-1011-top.png') });
const txt = await page.evaluate(() => document.body.innerText);
console.log('--- PAGE TEXT ---');
console.log(txt.slice(0, 2200));

await browser.close();
