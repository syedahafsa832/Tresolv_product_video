import puppeteer from 'puppeteer-core';
import path from 'node:path';
import { sleep } from './rec-lib.mjs';

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
await page.waitForFunction(() => !location.pathname.includes('login'), { timeout: 90000 }); await sleep(6000);

for (const route of ['automation', 'settings']) {
  await page.goto(`${BASE}/${route}`, { waitUntil: 'networkidle2' });
  await sleep(9000);
  const t = await page.evaluate(() => {
    const m = document.querySelector('main');
    return { url: location.pathname, sh: m?.scrollHeight, ch: m?.clientHeight, text: document.body.innerText.slice(0, 1400) };
  });
  console.log('=====', t.url, t.sh, '/', t.ch);
  console.log(t.text);
  await page.screenshot({ path: path.join(OUT, `probe-${route}.png`) });
}
await browser.close();
