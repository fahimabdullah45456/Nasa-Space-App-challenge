import { test, expect } from '@playwright/test';
test.setTimeout(120000);
import { advanceAngle, RATES } from '../src/scenes/sceneConfig.js';
const ready = async (page) => {
  await page.goto('/');
  await expect(page.getByTestId('scene')).toHaveAttribute(
    'data-status',
    'ready',
    { timeout: 30000 },
  );
  await page.waitForFunction(() => window.__SPACE_EXPLORER__?.snapshot().ready);
  await page.waitForTimeout(1500);
};
const snapshot = (page) =>
  page.evaluate(() => window.__SPACE_EXPLORER__.snapshot());
test('desktop renders genuine independent meshes, expected composition, and rotating layers', async ({
  page,
}) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  await ready(page);
  const a = await snapshot(page);
  await page.waitForFunction((minimum) => window.__SPACE_EXPLORER__.snapshot().frames >= minimum, a.frames + 2, { timeout: 15000 });
  const b = await snapshot(page);
  expect(a.geometry).toEqual([
    'BufferGeometry',
    'BufferGeometry',
    'BufferGeometry',
  ]);
  expect(a.cloudGeometry).toBe('BufferGeometry');
  expect(b.earth - a.earth).toBeGreaterThan(0.001);
  expect(b.clouds - a.clouds).toBeGreaterThan((b.earth - a.earth) * 1.025);
  expect(b.mars - a.mars).toBeGreaterThan(0.001);
  expect(b.triangles).toBeGreaterThan(40000);
  expect(a.layout.mars.position[2]).toBeLessThan(a.layout.earth.position[2]);
  expect(
    await page.evaluate(() => window.__SPACE_EXPLORER__.occlusion()),
  ).toEqual(['earth-surface', 'mars-surface']);
  expect(errors).toEqual([]);
  const positions = await page.evaluate(() => ({
    header: document.querySelector('.topbar').getBoundingClientRect().height,
    headline: document.querySelector('h1').getBoundingClientRect().top,
    archive: document.querySelector('.hardware-strip').getBoundingClientRect()
      .top,
    width: document.documentElement.scrollWidth,
    height: document.documentElement.scrollHeight,
  }));
  expect(positions).toEqual({
    header: 76,
    headline: 217,
    archive: 744,
    width: 1440,
    height: 1024,
  });
  await page.screenshot({ path: 'docs/test-desktop.png', fullPage: true });
});
test('rate integration is independent of 30/60/120 frame partitions', () => {
  function simulate(fps) {
    let angle = 0;
    for (let i = 0; i < fps * 10; i++)
      angle = advanceAngle(angle, 1 / fps, RATES.earth);
    return angle;
  }
  expect(simulate(30)).toBeCloseTo(simulate(120), 12);
  expect(simulate(60)).toBeCloseTo(RATES.earth * 10, 12);
});
test('navigation, archive selection, search and profile have deliberate behavior', async ({
  page,
}) => {
  await ready(page);
  await page
    .getByRole('button', { name: 'Select Mars destination', exact: true })
    .click();
  await expect(page.locator('.nav-link.active')).toHaveText('MARS');
  await expect(page.locator('.app')).toHaveAttribute('data-journey', 'arrived', { timeout: 45000 });
  await expect(page.locator('.hardware-strip')).toHaveAttribute('data-destination', 'mars');
  await page
    .getByRole('button', { name: 'EXPLORE THE ARCHIVE', exact: true })
    .click();
  await expect(page.locator('.nav-link.active')).toHaveText('MARS');
  await expect(page.locator('#archive-heading')).toBeFocused();
  await page
    .getByRole('button', { name: 'Search exploration hardware' })
    .click();
  await page.getByRole('searchbox').fill('Spirit');
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Spirit MARS ROVER · Mars' })
    .click();
  await expect(page.locator('.hardware-card[aria-pressed=true]')).toHaveCount(
    1,
  );
  await expect(page.locator('.hardware-card[aria-pressed=true]')).toContainText(
    'Spirit',
  );
  await page.screenshot({ path: 'docs/test-selected.png', fullPage: true });
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Explorer information' }).click();
  await expect(page.getByRole('dialog')).toContainText('no user accounts');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Explorer information' }),
  ).toBeFocused();
});
test('motion setting stops rotation and cloud motion; settings remain keyboard-operable', async ({
  page,
}) => {
  await ready(page);
  await page.getByRole('button', { name: 'Scene and motion settings' }).click();
  await page.getByText('Rendering preferences', { exact: true }).click();
  await page.getByLabel('Motion', { exact: true }).selectOption('reduce');
  await page.getByLabel('Rendering resolution').selectOption('low');
  await page.screenshot({ path: 'docs/test-settings.png', fullPage: true });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  const a = await snapshot(page);
  await page.waitForTimeout(900);
  const b = await snapshot(page);
  expect(b.reduced).toBe(true);
  expect(b.earth).toBe(a.earth);
  expect(b.clouds).toBe(a.clouds);
  expect(b.mars).toBe(a.mars);
  expect(b.pixelRatio).toBe(1);
  expect(b.frames - a.frames).toBeLessThanOrEqual(2);
});
test('system reduced motion skips movement from startup', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await ready(page);
  const a = await snapshot(page);
  await page.waitForTimeout(800);
  const b = await snapshot(page);
  expect(a.reduced).toBe(true);
  expect(a.earth).toBe(b.earth);
  expect(a.clouds).toBe(b.clouds);
  await expect(page.locator('h1')).toBeVisible();
});
test('programmatic GSAP camera hook moves and restores the real perspective camera', async ({
  page,
}) => {
  await ready(page);
  const before = await snapshot(page);
  await page.evaluate(() => window.__SPACE_EXPLORER__.focusDestination('Mars'));
  const after = await snapshot(page);
  expect(after.camera[0]).toBeLessThan(before.camera[0] - 1);
  expect(after.camera[2]).toBeLessThan(before.camera[2] - 3);
  await page.evaluate(() => window.__SPACE_EXPLORER__.resetCamera());
  const restored = await snapshot(page);
  expect(restored.camera[0]).toBeCloseTo(0, 5);
  expect(restored.camera[2]).toBeCloseTo(18, 5);
});
test('390px mobile layout keeps planets visible, controls reachable, and avoids overflow', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await ready(page);
  const bounds = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    scene: document.querySelector('.scene-layer').getBoundingClientRect()
      .bottom,
    heading: document.querySelector('h1').getBoundingClientRect().top,
    targets: [...document.querySelectorAll('.header-actions button')].map(
      (e) => e.getBoundingClientRect().width,
    ),
  }));
  expect(bounds.width).toBe(390);
  expect(bounds.heading).toBeGreaterThan(bounds.scene);
  expect(bounds.targets.every((w) => w >= 44)).toBe(true);
  await page.screenshot({ path: 'docs/test-mobile.png', fullPage: true });
  await page
    .getByRole('button', { name: 'Explore MARS ROVER Opportunity mission details' })
    .click();
  await expect(page.locator('.hardware-card[aria-pressed=true]')).toContainText(
    'Opportunity',
  );
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Scene and motion settings' }).click();
  await expect(page.getByRole('dialog', { name: 'DISPLAY SETTINGS' })).toBeVisible();
  await page.screenshot({
    path: 'docs/test-mobile-settings.png',
    fullPage: true,
  });
});
test('required model failure gives a usable fallback and retry recovers', async ({
  page,
}) => {
  await page.route('**/models/planets/mars.glb', (route) => route.abort());
  await page.goto('/');
  await expect(page.getByTestId('scene')).toHaveAttribute(
    'data-status',
    'error',
    { timeout: 30000 },
  );
  await expect(page.getByRole('alert')).toContainText(
    'models/planets/mars.glb',
  );
  await expect(page.locator('.hardware-card')).toHaveCount(4);
  await page.waitForTimeout(1800);
  await page.screenshot({ path: 'docs/test-asset-error.png', fullPage: true });
  await page.unroute('**/models/planets/mars.glb');
  await page.getByRole('button', { name: 'Retry scene' }).click();
  await expect(page.getByTestId('scene')).toHaveAttribute(
    'data-status',
    'ready',
    { timeout: 30000 },
  );
});
test('hidden-document signal pauses rendering and resumes without losing the scene', async ({
  page,
}) => {
  await ready(page);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', {
      get: () => true,
      configurable: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForTimeout(300);
  const a = await snapshot(page);
  await page.waitForTimeout(600);
  const b = await snapshot(page);
  expect(b.visible).toBe(false);
  expect(b.frames).toBe(a.frames);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', {
      get: () => false,
      configurable: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect.poll(async () => (await snapshot(page)).frames, { timeout: 15000 }).toBeGreaterThan(b.frames);
});
test('WebGL context loss shows a clear fallback', async ({ page }) => {
  await ready(page);
  await page.evaluate(() => window.__SPACE_EXPLORER__.loseContext());
  await expect(page.getByTestId('scene')).toHaveAttribute(
    'data-status',
    'error',
  );
  await expect(page.getByRole('alert')).toContainText('WebGL context was lost');
  await expect(page.getByRole('button', { name: 'Retry scene' })).toBeEnabled();
});
