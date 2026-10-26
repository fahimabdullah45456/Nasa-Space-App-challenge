import { test, expect } from '@playwright/test';
import { Quaternion } from 'three';
test.setTimeout(120000);
const nextFrames = (page, before) => page.waitForFunction((minimum) => window.__SPACE_EXPLORER__.snapshot().frames >= minimum, before.frames + 2, { timeout: 20000 });
const snapshot = (page) => page.evaluate(() => window.__SPACE_EXPLORER__.snapshot());
const settings = (page) => page.getByRole('button', { name: 'Scene and motion settings' });
const slider = (page) => page.getByRole('slider', { name: 'PLANET ROTATION SPEED' });
const ready = async (page) => {
  await page.goto('/');
  await expect(page.getByTestId('scene')).toHaveAttribute('data-status', 'ready', { timeout: 60000 });
  await page.waitForFunction(() => window.__SPACE_EXPLORER__?.snapshot().ready);
};
const open = async (page) => {
  await settings(page).click();
  await expect(page.getByRole('dialog', { name: 'DISPLAY SETTINGS' })).toBeVisible();
  await expect(slider(page)).toBeFocused();
  await expect(page.locator('#display-settings')).toHaveCSS('opacity', '1');
};
const speed = async (page, value) => {
  await slider(page).evaluate((element, next) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(element, String(next));
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
  await expect(slider(page)).toHaveValue(String(value));
  await expect(page.locator('.rotation-heading output')).toHaveText(`${value.toFixed(1)}×`);
  await expect.poll(async () => (await snapshot(page)).rotationSpeed).toBe(value);
};
const held = async (page) => {
  const a = await snapshot(page); await nextFrames(page, a); const b = await snapshot(page);
  expect(b.quaternions).toEqual(a.quaternions);
  expect(b.animationTimes).toEqual(a.animationTimes);
  return b;
};

test('only supplied GLBs are rendered once; original layout and resources survive speed changes', async ({ page }) => {
  const loads = [], errors = [];
  page.on('request', (request) => { if (/\.(glb|jpg|png)(\?|$)/.test(request.url())) loads.push(new URL(request.url()).pathname); });
  page.on('pageerror', (error) => errors.push(error.message));
  await ready(page);
  const a = await snapshot(page);
  expect(a.rotationSpeed).toBe(2); expect(a.isRotationPaused).toBe(false);
  expect(a.scenePlanetMeshes.sort()).toEqual(['earth-clouds', 'earth-surface', 'mars-surface', 'moon-surface']);
  expect(a.normalMaps).toEqual([true, true, true]);
  expect(a.mapSizes).toEqual([[8192,4096],[8192,4096],[8192,4096]]);
  expect(loads.filter((url) => url.endsWith('.glb')).sort()).toEqual(['/models/planets/earth.glb','/models/planets/mars.glb','/models/planets/moon.glb']);
  expect(loads.filter((url) => url.startsWith('/textures/'))).toEqual([]);
  await open(page);
  for (const value of [1, 4, 0, 2]) await speed(page, value);
  const b = await snapshot(page);
  for (const key of ['modelIds', 'meshIds', 'materialIds', 'textures', 'camera', 'layout']) expect(b[key]).toEqual(a[key]);
  expect(loads.filter((url) => url.endsWith('.glb'))).toHaveLength(3);
  expect(errors).toEqual([]);
});

test('toggle, outside click, Escape and keyboard focus work without closing during adjustment', async ({ page }) => {
  await ready(page); await open(page);
  await expect(slider(page)).toHaveAttribute('min', '0');
  await expect(slider(page)).toHaveAttribute('max', '4');
  await expect(slider(page)).toHaveAttribute('step', '0.1');
  await slider(page).press('ArrowRight'); await expect(slider(page)).toHaveValue('2.1');
  await expect(settings(page)).toHaveAttribute('aria-expanded', 'true');
  await slider(page).press('Tab');
  await expect(page.getByRole('button', { name: 'PAUSE ROTATION', exact: true })).toBeFocused();
  await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: 'RESUME ROTATION', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'RESET TO DEFAULT' })).toBeFocused();
  await page.keyboard.press('Enter'); await expect(slider(page)).toHaveValue('2');
  await page.keyboard.press('Escape');
  await expect(settings(page)).toBeFocused();
  await expect(settings(page)).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await settings(page).press('Enter'); await expect(slider(page)).toBeFocused();
  await settings(page).click(); await expect(settings(page)).toHaveAttribute('aria-expanded', 'false');
  await open(page); await page.locator('h1').click();
  await expect(settings(page)).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#display-settings')).toHaveAttribute('inert', '');
  expect(await page.locator('#display-settings').evaluate((element) => getComputedStyle(element).pointerEvents)).toBe('none');
});

test('0/1/2/4x apply exact multipliers to actual independent GLB animations', async ({ page }) => {
  await ready(page); await open(page);
  for (const value of [0, 1, 2, 4]) {
    await speed(page, value);
    const a = await snapshot(page); await nextFrames(page, a); const b = await snapshot(page);
    const elapsed = b.elapsedSceneSeconds - a.elapsedSceneSeconds;
    expect(elapsed).toBeGreaterThan(0);
    b.animationTimes.forEach((time, index) => expect(time - a.animationTimes[index]).toBeCloseTo(elapsed * value, 6));
    const angles = b.quaternions.map((q, i) => new Quaternion().fromArray(q).normalize().angleTo(new Quaternion().fromArray(a.quaternions[i]).normalize()));
    if (value === 0) expect(b.quaternions).toEqual(a.quaternions);
    else {
      angles.forEach((angle, i) => expect(angle).toBeCloseTo(elapsed * value * 2 * Math.PI / b.animationPeriods[i], 5));
      expect(angles[1]).toBeGreaterThan(angles[0]);
      expect(angles[0]).toBeGreaterThan(angles[2]);
      expect(angles[2]).toBeGreaterThan(angles[3]);
    }
    if (value === 0 || value === 4) await page.screenshot({ path: `docs/integration/settings-${value}x.png`, fullPage: true });
  }
});

test('pause preserves 3x, zero resumes at zero, and reset restores 2x unpaused', async ({ page }) => {
  await ready(page); await open(page); await speed(page, 3);
  await page.getByRole('button', { name: 'PAUSE ROTATION', exact: true }).click();
  await expect.poll(async () => (await snapshot(page)).isRotationPaused).toBe(true);
  await held(page);
  await page.getByRole('button', { name: 'RESUME ROTATION', exact: true }).click();
  const a = await snapshot(page); await nextFrames(page, a); const b = await snapshot(page);
  expect(b.rotationSpeed).toBe(3); expect(b.animationTimes[0]).toBeGreaterThan(a.animationTimes[0]);
  await speed(page, 0);
  await page.getByRole('button', { name: 'PAUSE ROTATION', exact: true }).click(); await held(page);
  await page.getByRole('button', { name: 'RESUME ROTATION', exact: true }).click();
  expect((await held(page)).rotationSpeed).toBe(0);
  await page.getByRole('button', { name: 'PAUSE ROTATION', exact: true }).click();
  await page.getByRole('button', { name: 'RESET TO DEFAULT' }).click();
  await expect(slider(page)).toHaveValue('2');
  const reset = await snapshot(page);
  expect(reset.rotationSpeed).toBe(2); expect(reset.isRotationPaused).toBe(false);
  await nextFrames(page, reset); expect((await snapshot(page)).animationTimes[0]).toBeGreaterThan(reset.animationTimes[0]);
});

test('selected speed and separate pause preference persist after reload', async ({ page }) => {
  await ready(page); await open(page); await speed(page, 3);
  await page.getByRole('button', { name: 'PAUSE ROTATION', exact: true }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('space-rotation')))).toEqual({ rotationSpeed: 3, isRotationPaused: true });
  await ready(page); const a = await held(page);
  expect(a.rotationSpeed).toBe(3); expect(a.isRotationPaused).toBe(true);
  await open(page); await expect(slider(page)).toHaveValue('3');
  await expect(page.getByRole('button', { name: 'RESUME ROTATION', exact: true })).toBeVisible();
});

test('malformed saved preferences fall back safely', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('space-rotation', '{broken-json'));
  await ready(page);
  expect((await snapshot(page)).rotationSpeed).toBe(2);
  expect((await snapshot(page)).isRotationPaused).toBe(false);
});

test('controls remain usable when localStorage reads and writes throw', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new DOMException('Storage blocked', 'SecurityError'); };
    Storage.prototype.setItem = () => { throw new DOMException('Storage blocked', 'SecurityError'); };
  });
  await ready(page); await open(page); await speed(page, 4);
  await page.getByRole('button', { name: 'PAUSE ROTATION', exact: true }).click(); await held(page);
  await page.getByRole('button', { name: 'RESET TO DEFAULT' }).click();
  expect((await snapshot(page)).effectiveRotationSpeed).toBe(2);
});

test('touch slider and popover fit 390px and 320px viewports', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, baseURL: 'http://127.0.0.1:5173' });
  try {
    const page = await context.newPage(); await ready(page);
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      await settings(page).tap();
      await expect(page.getByRole('dialog', { name: 'DISPLAY SETTINGS' })).toBeVisible();
      const bounds = await page.getByRole('dialog').boundingBox();
      expect(bounds.x).toBeGreaterThanOrEqual(11); expect(bounds.x + bounds.width).toBeLessThanOrEqual(width - 11);
      expect(bounds.y + bounds.height).toBeLessThanOrEqual(844 - 11);
      const range = await slider(page).boundingBox(); await page.touchscreen.tap(range.x + range.width - 2, range.y + range.height / 2);
      await expect(slider(page)).toHaveValue('4'); expect((await snapshot(page)).rotationSpeed).toBe(4);
      await page.getByRole('button', { name: 'PAUSE ROTATION', exact: true }).tap(); await held(page);
      await page.getByRole('button', { name: 'RESET TO DEFAULT' }).tap();
      await page.screenshot({ path: `docs/integration/mobile-${width}-settings.png`, fullPage: true });
      await settings(page).tap();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    }
  } finally { await context.close(); }
});

for (const planet of ['earth', 'moon']) {
  test(`${planet}.glb failure names the exact asset without hiding the archive`, async ({ page }) => {
    await page.route(`**/models/planets/${planet}.glb`, (route) => route.abort());
    await page.goto('/');
    await expect(page.getByTestId('scene')).toHaveAttribute('data-status', 'error', { timeout: 60000 });
    await expect(page.getByRole('alert')).toContainText(`models/planets/${planet}.glb`);
    await expect(page.locator('.hardware-card')).toHaveCount(4);
    await open(page); await expect(slider(page)).toHaveValue('2');
  });
}
