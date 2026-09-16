import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';
import { installCursor, moveTo, sleep, state } from './rec-lib.mjs';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'http://localhost:5173';
const TID = '7967cdb3-c575-4cf9-b1b6-958bdaabcae4';
const OUT = path.resolve('D:/hack5/hack5/videos/tresolv-demo/media/v8');
fs.mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 2 },
  args: ['--hide-scrollbars', '--force-color-profile=srgb', '--font-render-hinting=none'],
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

// ── A · the resolved conversation (the payoff) ───────────────────────────
await page.goto(`${BASE}/tickets/${TID}`, { waitUntil: 'networkidle2' });
await sleep(9000);
const okA = await page.evaluate(() => {
  const t = document.body.innerText;
  return t.includes('successfully cancelled') && t.includes('Resolved') && t.includes('#1012');
});
if (!okA) {
  const t = await page.evaluate(() => document.body.innerText.slice(0, 900));
  console.error('ABORT: resolved ticket did not render --- ' + t);
  await browser.close(); process.exit(1);
}
await installCursor(page);
let rec = await page.screencast({ path: path.join(OUT, 'resolved.webm'), fps: 30 });
state.x = 1180; state.y = 640;
await moveTo(page, 1180, 640, { duration: 10 });
await sleep(900);
await moveTo(page, 900, 520, { duration: 1400 });
await sleep(1200);
await moveTo(page, 1470, 150, { duration: 1500 });   // settles on the Resolved badge
await sleep(4200);
await rec.stop();
console.log('resolved captured');

// ── B · breadth: the real inbox, right-hand columns ──────────────────────
await page.goto(`${BASE}/tickets`, { waitUntil: 'networkidle2' });
await sleep(10000);
const okB = await page.evaluate(() => /Auto-resolved|Escalated|Resolved/.test(document.body.innerText));
if (!okB) { console.error('ABORT: inbox did not render'); await browser.close(); process.exit(1); }
await page.evaluate(() => { const m = document.querySelector('main'); if (m) m.scrollTo({ top: 0, behavior: 'instant' }); });
await sleep(1200);
await installCursor(page);
const scrollMain = (d) => page.evaluate((px) => {
  const m = document.querySelector('main'); if (m) m.scrollBy({ top: px, behavior: 'smooth' });
}, d);
rec = await page.screencast({ path: path.join(OUT, 'breadth.webm'), fps: 30 });
state.x = 1600; state.y = 700;
await moveTo(page, 1600, 700, { duration: 10 });
await sleep(1400);
await scrollMain(340); await sleep(1700);
await scrollMain(380); await sleep(1700);
await scrollMain(360); await sleep(1700);
await scrollMain(400); await sleep(2400);
await rec.stop();
console.log('breadth captured');

await browser.close();
for (const f of ['resolved.webm', 'breadth.webm']) {
  console.log(f, (fs.statSync(path.join(OUT, f)).size / 1024 / 1024).toFixed(1), 'MB');
}
