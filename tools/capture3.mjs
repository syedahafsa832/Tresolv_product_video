import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = 'http://localhost:5173';
const OUT = path.resolve('D:\\hack5\\hack5\\videos\\tresolv-demo\\media\\captures');
fs.mkdirSync(OUT, { recursive: true });
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
await page.type('input[type=email]', process.env.TRESOLV_EMAIL, { delay: 20 });
await page.type('input[type=password]', process.env.TRESOLV_PASSWORD, { delay: 20 });
await Promise.all([page.click('button[type=submit]'), page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {})]);
await settle(12000); // let BrandContext resolve before any data page
console.log('logged in');

// Strict: only save when the PENDING card for #1011 is actually rendered.
const grabStrict = async (name, url, required, { wait = 16000, tries = 6 } = {}) => {
  for (let i = 1; i <= tries; i++) {
    await page.goto(url, { waitUntil: 'networkidle2' });
    await settle(wait);
    const txt = await page.evaluate(() => document.body.innerText);
    const missing = required.filter((r) => !txt.includes(r));
    if (missing.length === 0) {
      await page.screenshot({ path: path.join(OUT, `${name}.png`) });
      console.log(`captured: ${name}.png`);
      return true;
    }
    console.log(`  retry ${i}/${tries} ${name} — missing: ${missing.join(' | ')}`);
    await settle(8000);
  }
  console.log(`FAILED: ${name}`);
  return false;
};

await grabStrict('02-escalations', `${BASE}/actions`, [
  'Cancel in Shopify',
  'Syeda Hafsa',
  'Order #1011',
  'Pending Approvals',
]);

await browser.close();
console.log('DONE');
