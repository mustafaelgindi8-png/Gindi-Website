// Renders quote.html to price-offer.pdf (pass --preview for PNGs of each page).
// The SAGA logo files are inlined as data URIs first, because Chromium will not
// apply CSS masks loaded from local files.
// Usage: node quotations/saga-highline-6-purple/render.js [--preview]
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const dir = __dirname;
const dataUri = (file, type) =>
  `data:${type};base64,${fs.readFileSync(path.join(dir, file)).toString('base64')}`;

(async () => {
  let html = fs.readFileSync(path.join(dir, 'quote.html'), 'utf8');
  html = html
    .replace('url(assets/saga-wordmark.svg)', `url("${dataUri('assets/saga-wordmark.svg', 'image/svg+xml')}")`)
    .replace('url(assets/saga-icon.png)', `url("${dataUri('assets/saga-icon.png', 'image/png')}")`);
  const tmp = path.join(dir, '_print.html'); // beside assets/ so the photo path resolves
  fs.writeFileSync(tmp, html);

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 2 });
    await page.goto('file://' + tmp, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.pdf({ path: path.join(dir, 'price-offer.pdf'), format: 'A4', printBackground: true, preferCSSPageSize: true });
    if (process.argv.includes('--preview')) {
      const pages = await page.$$('.page');
      for (let i = 0; i < pages.length; i++) {
        await pages[i].screenshot({ path: path.join(dir, `preview-${i + 1}.png`) });
      }
    }
  } finally {
    await browser.close();
    fs.unlinkSync(tmp);
  }
})();
