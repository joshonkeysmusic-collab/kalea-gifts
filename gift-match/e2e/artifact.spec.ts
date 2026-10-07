import { test, expect } from '@playwright/test';
import path from 'node:path';

test.use({ viewport: { width: 390, height: 844 } });

test('single-file build: admin works with blocked storage and no network', async ({ page }) => {
  await page.addInitScript(() => {
    const boom = () => { throw new Error('blocked'); };
    for (const k of ['localStorage', 'sessionStorage']) {
      Object.defineProperty(window, k, { get: boom, configurable: true });
    }
    window.fetch = () => Promise.reject(new Error('offline'));
  });
  await page.goto('file://' + path.resolve('dist-single/gift-match-single.html'));
  await page.getByRole('button', { name: 'Kalea Gifts', exact: true }).click();
  await page.getByLabel('PASSWORD', { exact: true }).fill('kalea-admin');
  await page.getByRole('button', { name: 'Unlock' }).click();
  await expect(page.getByRole('heading', { name: 'Catalogue admin' })).toBeVisible();
  await page.getByRole('tab', { name: 'Products' }).click();
  await page.getByRole('button', { name: /Add product/ }).first().click();
  await page.getByLabel('TITLE', { exact: true }).fill('Message cake');
  await page.getByLabel('PRICE (AED)', { exact: true }).fill('220');
  await page.getByLabel('CATEGORY', { exact: true }).selectOption('cakes');
  await page.getByRole('button', { name: /^Add product/ }).last().click();
  await page.getByRole('tab', { name: /Coverage/ }).click();
  await expect(page.getByText('No Cakes items')).toHaveCount(0);
});
