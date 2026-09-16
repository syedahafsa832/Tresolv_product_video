import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';
import { installCursor, moveTo, clickAt, sleep, state } from './rec-lib.mjs';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = 'http://localhost:5173';
const OUT = path.resolve('D:\\hack5\\hack5\\videos\\tresolv-demo\\media\\v6');
fs.mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 1 },
  args: ['--hide-scrollbars', '--force-color-profile=srgb', '--font-render-hinting=none'],
});
const page = await browser.newPage();
page.setDefaultTimeout(120000);

const waitFor = async (n, t = 90000) => {
  const t0 = Date.now();
  while (Date.now() - t0 < t) {
    if (await page.evaluate((x) => document.body.innerText.includes(x), n)) return true;
    await sleep(350);
  }
  console.log('  !! timeout waiting for', n);
  return false;
};

await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2' });
await page.waitForSelector('input[type=email]');
await page.type('input[type=email]', process.env.TRESOLV_EMAIL, { delay: 10 });
await page.type('input[type=password]', process.env.TRESOLV_PASSWORD, { delay: 10 });
await page.click('button[type=submit]');
await sleep(9000);

await page.goto(`${BASE}/actions`, { waitUntil: 'networkidle2' });
await waitFor('Pending Approvals');
await sleep(4000);

// ── PROBE: what does "View policy evidence" actually reveal? ───────────
const probe = await page.evaluate(() => {
  const toggles = [...document.querySelectorAll('button,div,span,a')].filter(
    (e) => e.offsetParent !== null && (e.textContent || '').trim().replace(/^[▸▾]\s*/, '') === 'View policy evidence'
  );
  if (!toggles.length) return { found: 0 };
  const t = toggles[0];
  const card = t.closest('div[class], div');
  const before = (card?.innerText || '').length;
  t.click();
  return { found: toggles.length, before };
});
await sleep(2000);
const probeText = await page.evaluate(() => {
  const t = [...document.querySelectorAll('*')].find(
    (e) => e.offsetParent !== null && /^[▾▸]?\s*View policy evidence/.test((e.textContent || '').trim()) && e.children.length < 3
  );
  const card = t ? t.closest('div')?.parentElement : null;
  return (card?.innerText || document.body.innerText).slice(0, 900);
});
console.log('PROBE toggles:', JSON.stringify(probe));
console.log('PROBE revealed:\n', probeText);
await page.screenshot({ path: path.join(OUT, 'probe-evidence.png') });

// ── CLIP A: the real completed state for #1012 ────────────────────────
await page.goto(`${BASE}/actions`, { waitUntil: 'networkidle2' });
await waitFor('Pending Approvals');
await sleep(4500);
await installCursor(page);

let rec = await page.screencast({ path: path.join(OUT, 'a-completed.webm'), fps: 30 });
state.x = 1450; state.y = 250;
await moveTo(page, 1450, 250, { duration: 10 });
await sleep(500);

// scroll down to the Completed disclosure
await page.evaluate(() => window.scrollBy({ top: 900, behavior: 'smooth' }));
await sleep(1400);
const comp = await page.evaluate(() => {
  const el = [...document.querySelectorAll('*')].find(
    (e) => e.offsetParent !== null && /^[▸▾]?\s*Completed \(/.test((e.textContent || '').trim()) && e.children.length < 4
  );
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: Math.round(r.x + 60), y: Math.round(r.y + r.height / 2) };
});
console.log('completed toggle:', JSON.stringify(comp));
if (comp) {
  await moveTo(page, comp.x, comp.y, { duration: 800 });
  await sleep(350);
  await clickAt(page, comp.x, comp.y, { pause: 220 });
  await sleep(2600); // the real executed rows render
  await page.evaluate(() => window.scrollBy({ top: 320, behavior: 'smooth' }));
  await sleep(2600);
}
await rec.stop();
const done = await page.evaluate(() => document.body.innerText.includes('#1012'));
console.log('clipA captured, #1012 visible:', done);

// ── CLIP B: purposeful scroll through the varied real inbox ───────────
await page.goto(`${BASE}/tickets`, { waitUntil: 'networkidle2' });
await waitFor('CHANNEL');
await sleep(5000);
await installCursor(page);

rec = await page.screencast({ path: path.join(OUT, 'b-inbox-scroll.webm'), fps: 30 });
state.x = 1500; state.y = 300;
await moveTo(page, 1500, 300, { duration: 10 });
await sleep(900);
await page.evaluate(() => window.scrollBy({ top: 380, behavior: 'smooth' }));
await sleep(1900);
await page.evaluate(() => window.scrollBy({ top: 420, behavior: 'smooth' }));
await sleep(1900);
await page.evaluate(() => window.scrollBy({ top: 400, behavior: 'smooth' }));
await sleep(2100);
await rec.stop();
console.log('clipB captured');

await browser.close();
for (const f of ['a-completed.webm', 'b-inbox-scroll.webm']) {
  console.log(f, (fs.statSync(path.join(OUT, f)).size / 1024 / 1024).toFixed(1), 'MB');
}
