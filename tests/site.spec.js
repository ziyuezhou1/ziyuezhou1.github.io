import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('genome-city-language', 'zh');
    localStorage.setItem('genome-city-quality', 'low');
  });
});

test('boots the immersive homepage and exposes the resume mode', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('body')).toHaveAttribute('data-ready', /true|fallback/);

  if ((await page.locator('body').getAttribute('data-ready')) === 'true') {
    const enter = page.getByRole('button', { name: /ENTER EXPERIENCE/ });
    await expect(enter).toBeEnabled();
    await enter.click();
    await expect(page.locator('body')).toHaveAttribute('data-started', 'true');
    await expect(page.getByRole('link', { name: 'A4 简历' })).toHaveAttribute('href', '/resume.html');

    await page.getByRole('button', { name: '切换语言' }).click();
    await expect(page.getByRole('link', { name: 'A4 Resume' })).toBeVisible();
  } else {
    await expect(page.getByRole('heading', { name: /PROJECT INDEX/ })).toBeVisible();
  }
});

test('keeps the preserved resume page reachable', async ({ page }) => {
  await page.goto('/resume.html');
  await expect(page).toHaveTitle(/周子悦/);
  await expect(page.getByText('CORE_ABILITIES')).toBeVisible();
  await expect(page.getByRole('button', { name: /SYS.EXPORT_PDF/ })).toBeVisible();
});

test('shows touch controls on a mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('body')).toHaveAttribute('data-ready', /true|fallback/);
  if ((await page.locator('body').getAttribute('data-ready')) === 'true') {
    await page.getByRole('button', { name: /ENTER EXPERIENCE/ }).click();
    await expect(page.getByRole('button', { name: '前进' })).toBeVisible();
    await expect(page.getByRole('button', { name: '加速' })).toBeVisible();
  }
});
