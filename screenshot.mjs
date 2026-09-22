// Puppeteer screenshot helper.
// Usage:
//   node screenshot.mjs http://localhost:3000
//   node screenshot.mjs http://localhost:3000 label
//   node screenshot.mjs http://localhost:3000 label --mobile   (375x812 viewport)
//   node screenshot.mjs http://localhost:3000 label --full     (full page height)
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const url = args[0];
const flags = args.filter((a) => a.startsWith('--'));
const label = args.find((a, i) => i > 0 && !a.startsWith('--'));
const mobile = flags.includes('--mobile');
const fullPage = flags.includes('--full') || true; // default full page

if (!url) {
  console.error('Usage: node screenshot.mjs <url> [label] [--mobile] [--full]');
  process.exit(1);
}

const outDir = path.join(process.cwd(), 'temporary screenshots');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const existing = fs
  .readdirSync(outDir)
  .map((f) => f.match(/^screenshot-(\d+)/))
  .filter(Boolean)
  .map((m) => parseInt(m[1], 10));
const next = existing.length ? Math.max(...existing) + 1 : 1;

const suffix = label ? `-${label}` : '';
const fileName = `screenshot-${next}${suffix}.png`;
const outPath = path.join(outDir, fileName);

const browser = await puppeteer.launch({ headless: 'new' });
try {
  const page = await browser.newPage();
  if (mobile) {
    await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  } else {
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  }
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 300)); // let entrance animations settle

  // Walk down the page like a real visitor so scroll-triggered reveals fire
  // before the full-page screenshot is taken (IntersectionObserver needs an
  // actual scroll pass, not just a resized viewport).
  if (fullPage) {
    await page.evaluate(async () => {
      const step = Math.round(window.innerHeight * 0.85);
      const max = document.body.scrollHeight;
      for (let y = 0; y < max; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 160));
      }
      window.scrollTo(0, 0);
    });
    // give the reveal-on-scroll safety net (1.8s) time to settle any stragglers
    await new Promise((r) => setTimeout(r, 2200));
  }

  await page.screenshot({ path: outPath, fullPage });
  console.log('Saved: ' + path.join('temporary screenshots', fileName));
} finally {
  await browser.close();
}
