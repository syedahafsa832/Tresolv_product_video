import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';
import { installCursor, moveTo, sleep, state } from './rec-lib.mjs';
import { ANON, ANON_LEAK_CHECK } from './anon.mjs';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'http://localhost:5173';
const OUT = path.resolve('D:/hack5/hack5/videos/tresolv-demo/media/v10');
fs.mkdirSync(OUT, { recursive: true });

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

const scrollMain = (d) => page.evaluate((px) => {
  const m = document.querySelector('main'); if (m) m.scrollBy({ top: px, behavior: 'smooth' });
}, d);
const toTop = () => page.evaluate(() => {
  const m = document.querySelector('main'); if (m) m.scrollTo({ top: 0, behavior: 'instant' });
});

// One sweep before capture, relying on the MutationObserver ANON installs
// to keep up with anything React renders afterward (no per-scroll re-sweep —
// that starved the page's main thread and hung the CDP protocol).
async function anonymise(label) {
  let n = await page.evaluate(ANON);
  if (n === 0) { await sleep(3000); n = await page.evaluate(ANON); } // data still loading
  const leak = await page.evaluate(ANON_LEAK_CHECK);
  console.log(label, 'substituted', n, JSON.stringify(leak));
  if (leak.bad.length || leak.codersLeft) throw new Error('ANON LEAK on ' + label);
}

// ── 1 · the inbox, whole page ────────────────────────────────────────────
await page.goto(`${BASE}/tickets`, { waitUntil: 'networkidle2' });
await sleep(11000);
await toTop(); await sleep(800);
await anonymise('tickets');
await installCursor(page);
let rec = await page.screencast({ path: path.join(OUT, 'inbox.webm'), fps: 30 });
state.x = 1250; state.y = 760;
await moveTo(page, 1250, 760, { duration: 10 });
await sleep(2200);
await moveTo(page, 900, 430, { duration: 1300 });
await sleep(1500);
await scrollMain(300); await sleep(1900);
await scrollMain(360); await sleep(1900);
await scrollMain(340); await sleep(1900);
await scrollMain(380); await sleep(2200);
await rec.stop();
console.log('inbox captured');

// ── 2 · the store the agent works from ───────────────────────────────────
await page.goto(`${BASE}/brands`, { waitUntil: 'networkidle2' });
await sleep(9000);
await anonymise('brands');
await installCursor(page);
rec = await page.screencast({ path: path.join(OUT, 'store.webm'), fps: 30 });
state.x = 1400; state.y = 520;
await moveTo(page, 1400, 520, { duration: 10 });
await sleep(700);
await moveTo(page, 1010, 235, { duration: 1600 });
await sleep(3800);
await rec.stop();
console.log('store captured');

await browser.close();
for (const f of ['inbox.webm', 'store.webm'])
  console.log(f, (fs.statSync(path.join(OUT, f)).size / 1048576).toFixed(1), 'MB');
