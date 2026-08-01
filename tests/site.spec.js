import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('genome-city-language', 'zh');
    localStorage.setItem('mini-city-quality', 'low');
  });
});

test('boots the miniature city, selects a car, and runs the optional race UI', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/');
  await expect(page.locator('body')).toHaveAttribute('data-ready', /true|fallback/, { timeout: 30_000 });

  if ((await page.locator('body').getAttribute('data-ready')) === 'true') {
    const plum = page.getByRole('button', { name: /Plum/ });
    await plum.click();
    await expect(plum).toHaveAttribute('aria-pressed', 'true');

    const enter = page.getByRole('button', { name: /ENTER EXPERIENCE/ });
    await expect(enter).toBeEnabled();
    await enter.click();
    await expect(page.locator('body')).toHaveAttribute('data-started', 'true');
    await expect(page.getByRole('link', { name: 'A4 简历' })).toHaveAttribute('href', '/resume.html');

    await page.getByRole('button', { name: '开始单圈计时赛' }).click();
    await expect(page.locator('body')).toHaveAttribute('data-race', /countdown|racing/);
    await expect(page.getByRole('button', { name: '退出计时赛' })).toBeVisible();
    await page.getByRole('button', { name: '退出计时赛' }).click();
    await expect(page.locator('body')).toHaveAttribute('data-race', 'idle');

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
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('body')).toHaveAttribute('data-ready', /true|fallback/, { timeout: 30_000 });
  if ((await page.locator('body').getAttribute('data-ready')) === 'true') {
    await page.getByRole('button', { name: /ENTER EXPERIENCE/ }).click();
    await expect(page.getByRole('button', { name: '前进' })).toBeVisible();
    await expect(page.getByRole('button', { name: '加速' })).toBeVisible();
  }
});

test('opens the four fixed-camera Style Lab demos', async ({ page }) => {
  test.setTimeout(120_000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/style-lab/');
  await expect(page.getByRole('heading', { name: 'Style Lab' })).toBeVisible();

  const routes = [
    ['/style-lab/city.html', 'Toy-block Modern City'],
    ['/style-lab/medieval.html', 'Storybook Kingdom'],
    ['/style-lab/space.html', 'Frontier Space Base'],
    ['/style-lab/nature.html', 'Low-poly Wilderness'],
  ];

  for (const [route, heading] of routes) {
    await page.goto(route);
    await expect(page.locator('body')).toHaveAttribute('data-ready', /true|fallback/, { timeout: 30_000 });
    await expect(page.getByRole('heading', { name: heading })).toBeVisible();
    if ((await page.locator('body').getAttribute('data-ready')) === 'true') {
      await expect(page.locator('#style-scene')).toBeVisible();
    } else {
      await expect(page.getByText(/WebGL is unavailable/)).toBeVisible();
    }
  }

  expect(errors).toEqual([]);
});
