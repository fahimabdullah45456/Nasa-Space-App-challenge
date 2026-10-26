import { test, expect } from '@playwright/test';

test('the complete archive filters seven vehicles and opens mission records', async ({ page }) => {
  await page.goto('/archive');
  await expect(page.locator('.archive-card')).toHaveCount(7);
  await page.getByRole('button', { name: 'Mars', exact: true }).click();
  await expect(page.locator('.archive-card')).toHaveCount(4);
  await page.getByRole('button', { name: 'Moon', exact: true }).click();
  await expect(page.locator('.archive-card')).toHaveCount(3);
  await page.getByRole('button', { name: 'All hardware', exact: true }).click();
  await page.getByRole('searchbox', { name: 'Search vehicles' }).fill('Curiosity');
  await expect(page.locator('.archive-card')).toHaveCount(1);
  await page.getByRole('button', { name: 'Open Curiosity mission record' }).click();
  await expect(page).toHaveURL(/\/rovers\/curiosity$/);
  await expect(page.locator('.vehicle-heading h1')).toHaveText('CURIOSITY');
});

test('Perseverance model exposes only mapped components and clears a selection', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/rovers/perseverance');
  await expect(page.locator('.component-drawer')).toHaveAttribute('aria-hidden', 'true');
  await page.locator('.stage-canvas canvas').waitFor({ timeout: 100_000 });
  await page.getByRole('button', { name: 'OPEN ROVER EXPLORER' }).click();
  const pixl = page.getByRole('button', { name: /PIXL/ });
  await expect(pixl).toBeEnabled({ timeout: 40_000 });
  await pixl.click();
  await expect(page.locator('.selected-component strong')).toHaveText('PIXL');
  await page.getByRole('button', { name: 'MINIMIZE EXPLORER' }).click();
  await page.getByRole('button', { name: 'OPEN ROVER EXPLORER' }).click();
  await expect(page.locator('.selected-component strong')).toHaveText('PIXL');
  await page.getByRole('button', { name: /CLEAR SELECTION/ }).click();
  await expect(page.locator('.selected-component')).toHaveCount(0);
});

test('site explorer labels NASA terrain and identifies context-only fallback', async ({ page }) => {
  await page.goto('/landing-sites/apollo-15-hadley-apennine');
  await expect(page.locator('.landing-heading h1')).toHaveText('HADLEY–APENNINE');
  await expect(page.locator('.terrain-stage')).toBeVisible();
  await expect(page.locator('.stage-context-note')).toContainText('NASA terrain mesh');
  await page.goto('/rovers/yutu-2');
  await expect(page.locator('.vehicle-photo-stage')).toBeVisible();
  await expect(page.locator('.photo-stage-caption small')).toContainText('No verified');
  await page.goto('/landing-sites/yutu-2-von-karman');
  await expect(page.locator('.landing-coordinate strong')).toContainText('45.4562° S');
  await expect(page.locator('.landing-disclaimer p')).toContainText('No NASA local terrain model');
});
