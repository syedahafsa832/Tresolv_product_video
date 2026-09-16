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
await settle(10000);
console.log('logged in');

// Capture with a content check + retry, so we never save an error state.
const grab = async (name, url, mustContain, { wait = 14000, tries = 3, before } = {}) => {
  for (let i = 1; i <= tries; i++) {
    await page.goto(url, { waitUntil: 'networkidle2' });
    await settle(wait);
    if (before) { try { await before(page); } catch (e) { console.log('  before() failed:', e.message); } }
    const txt = await page.evaluate(() => document.body.innerText);
    const bad = /Failed to load|No conversations found|Something went wrong/i.test(txt);
    const ok = mustContain ? txt.includes(mustContain) : true;
    if (!bad && ok) {
      await page.screenshot({ path: path.join(OUT, `${name}.png`) });
      console.log(`captured: ${name}.png`);
      return true;
    }
    console.log(`  retry ${i}/${tries} for ${name} (bad=${bad}, found=${ok})`);
    await settle(6000);
  }
  console.log(`FAILED: ${name}`);
  return false;
};

// 1011 pending approval + the whole escalations queue
await grab('02-escalations', `${BASE}/actions`, 'Order #1011');

// Escalations with the Completed section expanded (real executed actions)
await grab('09-escalations-completed', `${BASE}/actions`, 'Order #1011', {
  before: async (p) => {
    await p.evaluate(() => {
      const els = [...document.querySelectorAll('*')];
      const t = els.find((e) => /^Completed \(/.test((e.textContent || '').trim()) && e.children.length < 3);
      if (t) t.click();
    });
    await new Promise((r) => setTimeout(r, 3500));
  },
});

// Syeda Hafsa's COMPLETED cancellation of order #1010 — activity + order context + confirmation
await grab('07-cancel-1010', `${BASE}/tickets/616f990e-8ff8-44c6-a7d8-0d655071ff84`, '1010');

// Grounded product answer built from the real catalogue
await grab('08-grounded-reply', `${BASE}/tickets/6dc34482-3fc6-46a0-8770-501d46ae7add`, 'dresses');

// Inbox
await grab('01-inbox', `${BASE}/tickets`, 'CHANNEL');

// Review queue
await grab('03-review-queue', `${BASE}/review`, 'Review');

await browser.close();
console.log('\nDONE');
