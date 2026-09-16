import puppeteer from 'puppeteer-core';
import path from 'node:path';
import { sleep } from './rec-lib.mjs';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = 'http://localhost:5173';
const OUT = path.resolve('D:\\hack5\\hack5\\videos\\tresolv-demo\\media\\v6');

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 1 },
  args: ['--hide-scrollbars'],
});
const page = await browser.newPage();
page.setDefaultTimeout(120000);
await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2' });
await page.waitForSelector('input[type=email]');
await page.type('input[type=email]', process.env.TRESOLV_EMAIL, { delay: 10 });
await page.type('input[type=password]', process.env.TRESOLV_PASSWORD, { delay: 10 });
await page.click('button[type=submit]');
await sleep(9000);
await page.goto(`${BASE}/actions`, { waitUntil: 'networkidle2' });
await sleep(7000);

// Which element actually scrolls?
const scrollers = await page.evaluate(() => {
  return [...document.querySelectorAll('*')]
    .filter((e) => e.scrollHeight > e.clientHeight + 80 && e.clientHeight > 300)
    .slice(0, 6)
    .map((e) => ({
      tag: e.tagName, cls: (e.className || '').toString().slice(0, 60),
      sh: e.scrollHeight, ch: e.clientHeight,
    }));
});
console.log('scrollers:', JSON.stringify(scrollers, null, 1));

// Click the Completed disclosure directly, then read what appears
const res = await page.evaluate(() => {
  const el = [...document.querySelectorAll('*')].find(
    (e) => /^[▸▾]?\s*Completed \(/.test((e.textContent || '').trim()) && e.children.length < 4
  );
  if (!el) return 'NO_TOGGLE';
  el.click();
  return 'CLICKED ' + el.textContent.trim();
});
console.log('completed:', res);
await sleep(2500);

const body = await page.evaluate(() => document.body.innerText);
const i = body.indexOf('Completed');
console.log('--- after expand ---');
console.log(body.slice(i, i + 1200));

// Scroll the right container to bring #1012 into view, then shoot it
const shot = await page.evaluate(() => {
  const target = [...document.querySelectorAll('*')].find(
    (e) => e.offsetParent !== null && (e.textContent || '').includes('#1012') && e.textContent.length < 400
  );
  if (!target) return null;
  target.scrollIntoView({ block: 'center' });
  const r = target.getBoundingClientRect();
  return { y: Math.round(r.y), h: Math.round(r.height), text: target.innerText.slice(0, 260) };
});
console.log('1012 row:', JSON.stringify(shot));
await sleep(1200);
await page.screenshot({ path: path.join(OUT, 'probe-completed.png') });
await browser.close();
