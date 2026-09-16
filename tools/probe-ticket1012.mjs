import puppeteer from 'puppeteer-core';
import path from 'node:path';
import { sleep } from './rec-lib.mjs';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = 'http://localhost:5173';
const TID = '7967cdb3-c575-4cf9-b1b6-958bdaabcae4';
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
await page.goto(`${BASE}/tickets/${TID}`, { waitUntil: 'networkidle2' });
await sleep(9000);

const info = await page.evaluate(() => {
  const m = document.querySelector('main');
  return {
    scroll: m ? { sh: m.scrollHeight, ch: m.clientHeight } : null,
    text: document.body.innerText.slice(0, 2500),
  };
});
console.log(JSON.stringify(info.scroll));
console.log('--- TEXT ---');
console.log(info.text);
await page.screenshot({ path: path.join(OUT, 'ticket1012-top.png') });
await page.evaluate(() => { const m = document.querySelector('main'); if (m) m.scrollTo({ top: m.scrollHeight, behavior: 'instant' }); });
await sleep(1500);
await page.screenshot({ path: path.join(OUT, 'ticket1012-bottom.png') });
await browser.close();
