import puppeteer from 'puppeteer-core';
import { sleep } from './rec-lib.mjs';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = 'http://localhost:5173';

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  defaultViewport: { width: 1600, height: 900, deviceScaleFactor: 1 },
});
const page = await browser.newPage();
page.setDefaultTimeout(90000);

await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2' });
await page.waitForSelector('input[type=email]');
await page.type('input[type=email]', process.env.TRESOLV_EMAIL, { delay: 15 });
await page.type('input[type=password]', process.env.TRESOLV_PASSWORD, { delay: 15 });
await Promise.all([page.click('button[type=submit]'), page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {})]);
await sleep(12000);

await page.goto(`${BASE}/actions`, { waitUntil: 'networkidle2' });
await sleep(14000);

// Find the #1011 card specifically and click its own "View policy evidence"
const clicked = await page.evaluate(() => {
  const cards = [...document.querySelectorAll('div')].filter(d =>
    (d.textContent || '').includes('Order #1011') && (d.textContent || '').includes('Cancel in Shopify')
  );
  // Pick the smallest matching container (the actual card, not an ancestor)
  cards.sort((a, b) => a.textContent.length - b.textContent.length);
  const card = cards[0];
  if (!card) return 'CARD_NOT_FOUND';
  const toggle = [...card.querySelectorAll('*')].find(e => (e.textContent||'').trim() === 'View policy evidence' && e.children.length <= 1);
  if (!toggle) return 'TOGGLE_NOT_FOUND';
  toggle.click();
  return 'CLICKED';
});
console.log('toggle result:', clicked);
await sleep(1500);

const cardText = await page.evaluate(() => {
  const cards = [...document.querySelectorAll('div')].filter(d =>
    (d.textContent || '').includes('Order #1011') && (d.textContent || '').includes('Cancel in Shopify')
  );
  cards.sort((a, b) => a.textContent.length - b.textContent.length);
  return cards[0] ? cards[0].innerText : 'NOT FOUND';
});
console.log('--- #1011 CARD FULL TEXT ---');
console.log(cardText);

await browser.close();
