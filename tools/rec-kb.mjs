import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';
import { installCursor, moveTo, sleep, state } from './rec-lib.mjs';
import { ANON, ANON_LEAK_CHECK } from './anon.mjs';

const BASE = 'http://localhost:5173';
const OUT = path.resolve('D:/hack5/hack5/videos/tresolv-demo/media/v11');
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
await page.goto(`${BASE}/settings`, { waitUntil: 'networkidle2' });
await sleep(7000);
// Click the "Knowledge Base" tab
const tab = await page.evaluate(() => {
  const cands = [...document.querySelectorAll('button,a,[role="tab"],div,span')].filter(
    (e) => e.children.length === 0 && (e.textContent || '').trim() === 'Knowledge Base'
  );
  const el = cands[0];
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2), tag: el.tagName, n: cands.length };
});
console.log('KB tab:', JSON.stringify(tab));
if (!tab) { console.error('ABORT: no Knowledge Base tab found'); await browser.close(); process.exit(1); }
await installCursor(page);
state.x = tab.x - 300; state.y = tab.y + 200;
await moveTo(page, state.x, state.y, { duration: 8 });
await sleep(500);
await moveTo(page, tab.x, tab.y, { duration: 700 });
await sleep(250);
await page.mouse.click(tab.x, tab.y, { delay: 60 });
await sleep(1800);
let n = await page.evaluate(ANON);
const leak = await page.evaluate(ANON_LEAK_CHECK);
console.log('kb substituted', n, JSON.stringify(leak));
if (leak.bad.length || leak.codersLeft) { console.error('LEAK'); await browser.close(); process.exit(1); }
const rec = await page.screencast({ path: path.join(OUT, 'kb.webm'), fps: 30 });
await moveTo(page, 950, 500, { duration: 1400 });
await sleep(4000);
await rec.stop();
await browser.close();
console.log('kb.webm', (fs.statSync(path.join(OUT, 'kb.webm')).size / 1048576).toFixed(1), 'MB');
