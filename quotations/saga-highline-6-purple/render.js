// Renders quote.html to price-offer.pdf (and PNG previews of each page).
// Usage: node quotations/saga-highline-6-purple/render.js
const path = require('path');
const { chromium } = require('playwright');

(async () => {
  const dir = __dirname;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 2 });
  await page.goto('file://' + path.join(dir, 'quote.html'), { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({ path: path.join(dir, 'price-offer.pdf'), format: 'A4', printBackground: true, preferCSSPageSize: true });
  if (process.argv.includes('--preview')) {
    const pages = await page.$$('.page');
    for (let i = 0; i < pages.length; i++) {
      await pages[i].screenshot({ path: path.join(dir, `preview-${i + 1}.png`) });
    }
  }
  await browser.close();
})();
