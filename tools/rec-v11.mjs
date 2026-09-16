import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';
import { installCursor, moveTo, sleep, state } from './rec-lib.mjs';
import { ANON, ANON_LEAK_CHECK } from './anon.mjs';

const BASE = 'http://localhost:5173';
const OUT = path.resolve('D:/hack5/hack5/videos/tresolv-demo/media/v11');
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

async function anonymise(label) {
  let n = await page.evaluate(ANON);
  if (n === 0) { await sleep(2500); n = await page.evaluate(ANON); }
  const leak = await page.evaluate(ANON_LEAK_CHECK);
  console.log(label, 'substituted', n, JSON.stringify(leak));
  if (leak.bad.length || leak.codersLeft) { console.error('LEAK on', label); await browser.close(); process.exit(1); }
}

// ── 1 · Dashboard Overview — the real "Knowledge Base: Products,
//        collections and policies imported" onboarding line. ────────────
await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle2' });
await sleep(9000);
await anonymise('dashboard');
await installCursor(page);
let rec = await page.screencast({ path: path.join(OUT, 'dashboard.webm'), fps: 30 });
state.x = 1400; state.y = 700;
await moveTo(page, 1400, 700, { duration: 8 });
await sleep(600);
await moveTo(page, 950, 500, { duration: 1500 });
await sleep(4200);
await rec.stop();
console.log('dashboard captured');

// ── 2 · A real ticket with a real Activity trail + Order Context — used
//        ONLY as breadth b-roll (a different, clearly-other ticket; never
//        attributed to #1012). ───────────────────────────────────────────
const TID = '80b2184b-77f5-4e04-b112-7678f4b59e7b';
await page.goto(`${BASE}/tickets/${TID}`, { waitUntil: 'networkidle2' });
await sleep(9000);
await anonymise('activity-ticket');
const has = await page.evaluate(() => document.body.innerText.includes('Order Context'));
console.log('has order context panel:', has);
await installCursor(page);
rec = await page.screencast({ path: path.join(OUT, 'activity.webm'), fps: 30 });
state.x = 1600; state.y = 300;
await moveTo(page, 1600, 300, { duration: 8 });
await sleep(700);
await page.evaluate(() => {
  const el = [...document.querySelectorAll('*')].find(e => e.textContent.trim() === 'Activity' && e.children.length === 0);
  if (el) el.scrollIntoView({ block: 'start', behavior: 'instant' });
});
await sleep(1200);
await moveTo(page, 1600, 700, { duration: 1400 });
await sleep(3600);
await rec.stop();
await browser.close();
for (const f of ['dashboard.webm', 'activity.webm'])
  console.log(f, (fs.statSync(path.join(OUT, f)).size / 1048576).toFixed(1), 'MB');
