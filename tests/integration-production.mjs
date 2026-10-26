import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/usr/local/bin/chromium',
  headless: true,
  args: ['--no-sandbox', '--enable-webgl', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const results = [];
try {
  for (const viewport of [{ width: 1440, height: 1024 }, { width: 800, height: 1024 }, { width: 390, height: 844 }, { width: 320, height: 844 }]) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    const errors = [], failedRequests = [], models = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('requestfailed', (request) => failedRequests.push({ url: request.url(), failure: request.failure() }));
    page.on('response', (response) => {
      if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
      if (response.url().endsWith('.glb')) models.push({ url: new URL(response.url()).pathname, status: response.status() });
    });
    await page.goto('http://127.0.0.1:4173/');
    await page.getByTestId('scene').waitFor({ state: 'visible' });
    await page.waitForFunction(() => document.querySelector('[data-testid="scene"]')?.dataset.status === 'ready', null, { timeout: 60000 });
    await page.waitForFunction(() => getComputedStyle(document.querySelector('.canvas-wrap')).opacity === '1');
    assert.equal(await page.evaluate(() => typeof window.__SPACE_EXPLORER__), 'undefined', 'development diagnostics must not be shipped');
    assert.equal(await page.locator('canvas').count(), 1);
    assert.equal(await page.locator('.hardware-card').count(), 4);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), viewport.width);
    const layout = await page.evaluate(() => Object.fromEntries(['.topbar','h1','.hero-actions','.hardware-strip','.mission-overview'].map((selector) => {
      const bounds = document.querySelector(selector).getBoundingClientRect();
      return [selector, { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height }];
    })));
    if (viewport.width === 1440) {
      const before = JSON.parse(await fs.readFile('docs/integration/before-layout.json', 'utf8'));
      assert.deepEqual(layout, before.boxes, 'existing desktop HTML layout must not move');
    }
    await page.screenshot({ path: `docs/integration/production-${viewport.width}-overview.png`, fullPage: true });
    const trigger = page.getByRole('button', { name: 'Scene and motion settings' });
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'DISPLAY SETTINGS' });
    await dialog.waitFor({ state: 'visible' });
    await page.waitForFunction(() => getComputedStyle(document.getElementById('display-settings')).opacity === '1');
    const range = page.getByRole('slider', { name: 'PLANET ROTATION SPEED' });
    assert.equal(await range.inputValue(), '2');
    const bounds = await dialog.boundingBox();
    assert.ok(bounds.x >= 11 && bounds.x + bounds.width <= viewport.width - 11);
    assert.ok(bounds.y >= 0 && bounds.y + bounds.height <= viewport.height - 11);
    const values = [];
    for (const value of viewport.width === 1440 ? [2, 0, 4] : [2, 4]) {
      if (value === 0) await range.press('Home');
      if (value === 4) await range.press('End');
      assert.equal(await range.inputValue(), String(value));
      assert.equal(await page.locator('.rotation-heading output').textContent(), `${value.toFixed(1)}×`);
      values.push(value);
      if (value === 2 || viewport.width === 1440 || viewport.width === 390) await page.screenshot({ path: `docs/integration/production-${viewport.width}-settings-${value}x.png`, fullPage: false });
    }
    await page.getByRole('button', { name: 'PAUSE ROTATION', exact: true }).click();
    assert.equal(await page.getByRole('button', { name: 'RESUME ROTATION', exact: true }).getAttribute('aria-pressed'), 'true');
    await page.getByRole('button', { name: 'RESET TO DEFAULT' }).click();
    assert.equal(await range.inputValue(), '2');
    await page.getByText('Rendering preferences', { exact: true }).click();
    if (viewport.width === 1440 || viewport.width === 320) await page.screenshot({ path: `docs/integration/production-${viewport.width}-advanced.png`, fullPage: false });
    await page.keyboard.press('Escape');
    assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
    assert.deepEqual(models.map((model) => model.url).sort(), ['/models/planets/earth.glb','/models/planets/mars.glb','/models/planets/moon.glb']);
    assert.ok(models.every((model) => model.status === 200));
    assert.deepEqual(failedRequests, []);
    assert.deepEqual(errors, []);
    results.push({ viewport, modelLoads: models, errors, failedRequests, sliderValues: values, layout, popoverBounds: bounds, preservedDesktopLayout: viewport.width === 1440 });
    console.log(`Production ${viewport.width}px: exact GLBs, controls, viewport bounds and runtime checks passed.`);
    await context.close();
  }
  await fs.writeFile('docs/integration/production-report.json', JSON.stringify(results, null, 2) + '\n');
} finally { await browser.close(); }
