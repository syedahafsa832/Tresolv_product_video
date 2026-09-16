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

// Scroll MAIN so the Completed disclosure is on screen, then click it for real
const pos = await page.evaluate(() => {
  const main = document.querySelector('main');
  const el = [...document.querySelectorAll('*')].find(
    (e) => /^[▸▾]?\s*Completed \(/.test((e.textContent || '').trim()) && e.children.length < 4
  );
  if (!el) return null;
  const top = el.getBoundingClientRect().top + main.scrollTop - 420;
  main.scrollTo({ top, behavior: 'instant' });
  return true;
});
await sleep(1200);
const box = await page.evaluate(() => {
  const el = [...document.querySelectorAll('*')].find(
    (e) => /^[▸▾]?\s*Completed \(/.test((e.textContent || '').trim()) && e.children.length < 4
  );
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: Math.round(r.x + 50), y: Math.round(r.y + r.height / 2), t: el.textContent.trim() };
});
console.log('toggle box:', JSON.stringify(box), 'scrolled:', pos);
if (box) {
  await page.mouse.click(box.x, box.y, { delay: 60 });
  await sleep(2800);
}
const after = await page.evaluate(() => {
  const b = document.body.innerText;
  const i = b.indexOf('Completed (');
  return { has1012: b.includes('#1012'), slice: b.slice(i, i + 700) };
});
console.log('has #1012:', after.has1012);
console.log(after.slice);
await page.screenshot({ path: path.join(OUT, 'probe2.png') });
await browser.close();
