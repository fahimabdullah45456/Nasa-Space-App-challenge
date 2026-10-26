import { chromium } from 'playwright';
const browser = await chromium.launch({ executablePath: '/usr/local/bin/chromium', headless: true, args: ['--no-sandbox', '--enable-webgl', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1024 } });
  await page.goto('http://127.0.0.1:5173');
  await page.waitForFunction(() => window.__SPACE_EXPLORER__?.snapshot().ready);
  await page.getByRole('button', { name: 'Scene and motion settings' }).click();
  for (let i = 0; i < 3; i++) {
    await page.waitForTimeout(2000);
    const result = await page.locator('#display-settings').evaluate(e => ({
      matches: e.matches(".settings-popover[data-open='true']"),
      outer: e.outerHTML.slice(0, 350),
      opacity: getComputedStyle(e).opacity,
      visibility: getComputedStyle(e).visibility,
      anim: e.getAnimations().map(x => ({ state: x.playState, time: x.currentTime })),
      rules: [...document.styleSheets].flatMap(s => [...s.cssRules]).filter(r => r.selectorText?.includes('settings-popover[')).map(r => r.cssText),
      frames: window.__SPACE_EXPLORER__?.snapshot().frames,
    }));
    console.log(result);
  }
  await page.screenshot({ path: 'docs/integration/settings-debug.png' });
} finally { await browser.close(); }
