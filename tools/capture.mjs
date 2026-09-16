import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = 'http://localhost:5173';
const EMAIL = process.env.TRESOLV_EMAIL;
const PASSWORD = process.env.TRESOLV_PASSWORD;
const OUT = path.resolve('media/captures');

fs.mkdirSync(OUT, { recursive: true });

const shot = async (page, name) => {
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file });
  console.log(`captured: ${name}.png`);
};

const settle = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  defaultViewport: { width: 1600, height: 900, deviceScaleFactor: 2 },
  args: ['--hide-scrollbars', '--force-device-scale-factor=2'],
});

const page = await browser.newPage();
page.setDefaultTimeout(60000);

// ── Login ────────────────────────────────────────────────────────────────
await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2' });
await page.waitForSelector('input[type=email]');
await page.type('input[type=email]', EMAIL, { delay: 20 });
await page.type('input[type=password]', PASSWORD, { delay: 20 });
await Promise.all([
  page.click('button[type=submit]'),
  page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {}),
]);
await settle(8000);
console.log('logged in:', page.url());

// ── Pages to capture ─────────────────────────────────────────────────────
const targets = [
  { name: '01-inbox', url: `${BASE}/tickets`, wait: 12000 },
  { name: '02-escalations', url: `${BASE}/actions`, wait: 14000 },
  { name: '03-review-queue', url: `${BASE}/review`, wait: 12000 },
  { name: '04-automation', url: `${BASE}/automation`, wait: 12000 },
  { name: '05-luna-training', url: `${BASE}/training`, wait: 12000 },
  { name: '06-home', url: `${BASE}/dashboard`, wait: 12000 },
];

for (const t of targets) {
  try {
    await page.goto(t.url, { waitUntil: 'networkidle2' });
    await settle(t.wait);
    await shot(page, t.name);
  } catch (e) {
    console.log(`FAILED ${t.name}: ${e.message}`);
  }
}

// ── Ticket detail (Activity checklist + Order Context) ────────────────────
try {
  await page.goto(`${BASE}/tickets`, { waitUntil: 'networkidle2' });
  await settle(10000);
  const href = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('tr')];
    const row = rows.find((r) => /#\w{8}/.test(r.textContent || ''));
    if (row) row.click();
    return window.location.pathname;
  });
  await settle(9000);
  console.log('ticket detail url:', page.url(), href);
  await shot(page, '07-ticket-detail');
} catch (e) {
  console.log(`FAILED ticket detail: ${e.message}`);
}

await browser.close();
console.log('\nDONE. Files in', OUT);
