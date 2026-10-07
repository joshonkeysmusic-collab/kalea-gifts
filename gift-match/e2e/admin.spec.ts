import { expect, test, type Page } from '@playwright/test';

const PASSWORD = 'kalea-admin'; // the placeholder default (VITE_ADMIN_PASSWORD is not set in tests)
const shot = (page: Page, name: string) => page.screenshot({ path: `screenshots/admin-${name}.png`, fullPage: true, animations: 'disabled' });

async function unlock(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Kalea Gifts', exact: true }).click();
  await page.getByLabel('PASSWORD', { exact: true }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Unlock' }).click();
  await expect(page.getByRole('heading', { name: 'Catalogue admin' })).toBeVisible();
}

test('the logo opens a hidden login, a wrong password is refused, the right one opens the admin', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('dialog')).toHaveCount(0); // nothing visible until the logo is clicked
  await page.getByRole('button', { name: 'Kalea Gifts', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Admin access' });
  await expect(dialog).toBeVisible();
  await shot(page, '1-login');

  await page.getByLabel('PASSWORD', { exact: true }).fill('wrong');
  await page.getByRole('button', { name: 'Unlock' }).click();
  await expect(page.getByRole('alert').filter({ hasText: "isn't right" })).toHaveText(/4 tries left/);
  await expect(page.getByLabel('PASSWORD', { exact: true })).toHaveValue('');

  await page.getByRole('button', { name: 'Show password' }).click();
  await expect(page.getByLabel('PASSWORD', { exact: true })).toHaveAttribute('type', 'text');
  await page.getByLabel('PASSWORD', { exact: true }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Unlock' }).click();
  await expect(page).toHaveURL(/#\/admin$/);
  await expect(page.getByRole('heading', { name: 'Catalogue admin' })).toBeVisible();
  // The placeholder password is called out until it is changed.
  await expect(page.getByText(/still using the placeholder password/)).toBeVisible();
});

test('cancel and Escape close the login; five wrong tries lock it', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Kalea Gifts', exact: true }).click();
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Kalea Gifts', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);

  await page.getByRole('button', { name: 'Kalea Gifts', exact: true }).click();
  for (let i = 0; i < 4; i++) {
    await page.getByLabel('PASSWORD', { exact: true }).fill(`nope${i}`);
    await page.getByRole('button', { name: 'Unlock' }).click();
    // Wait for THIS attempt's answer (4, 3, 2, 1 tries left) before the next one.
    await expect(page.getByRole('alert').filter({ hasText: "isn't right" })).toHaveText(new RegExp(`${4 - i} (tries|try) left`));
  }
  await page.getByLabel('PASSWORD', { exact: true }).fill('nope4');
  await page.getByRole('button', { name: 'Unlock' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Too many wrong tries' })).toContainText(/Try again in \d+s/);
  await expect(page.getByLabel('PASSWORD', { exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Unlock' })).toBeDisabled();
});

test('opening /#/admin directly asks for the password, and Lock signs out', async ({ page }) => {
  await page.goto('/#/admin');
  await expect(page.getByRole('dialog', { name: 'Admin access' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Catalogue admin' })).toHaveCount(0);
  await page.getByLabel('PASSWORD', { exact: true }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Unlock' }).click();
  await expect(page.getByRole('heading', { name: 'Catalogue admin' })).toBeVisible();

  await page.reload(); // still signed in for this tab
  await expect(page.getByRole('heading', { name: 'Catalogue admin' })).toBeVisible();

  await page.getByRole('button', { name: 'Lock' }).click();
  await expect(page.getByRole('button', { name: 'Start Gift Match' })).toBeVisible();
  await page.goto('/#/admin');
  await expect(page.getByRole('dialog', { name: 'Admin access' })).toBeVisible();
});

test('the coverage dashboard shows counts and the real gaps', async ({ page }) => {
  await unlock(page);
  await expect(page.getByRole('tab', { name: /Coverage/ })).toHaveAttribute('aria-selected', 'true');
  const tile = (label: string) => page.locator('.cov-tile').filter({ hasText: label });
  await expect(tile('Gifts').first()).toContainText('55');
  await expect(tile('Critical')).toContainText('1');
  await expect(tile('Empty categories')).toContainText('1');
  await expect(page.locator('.cov-banner')).toContainText(/to fix before launch, 1 critical/);
  const cakes = page.locator('.cov-row').filter({ hasText: 'Cakes' });
  await expect(cakes).toHaveClass(/empty/);
  await expect(cakes.locator('.cov-flag')).toHaveText('Empty');
  await expect(page.locator('.cov-alert.critical')).toContainText('No Cakes items.');
  await expect(page.locator('.cov-alert.critical small')).toContainText('Add at least 2 cakes items');
  await expect(page.locator('.cov-alert.warning').first()).toBeVisible();
  await expect(page.locator('.cov-chips li').filter({ hasText: 'Coffee' })).toContainText('6');
  await shot(page, '2-coverage');
});

test('add a product: validation, live rule preview, coverage impact, save, and the dashboard updates', async ({ page }) => {
  await unlock(page);
  await page.getByRole('tab', { name: 'Products' }).click();
  await page.getByRole('button', { name: /Add product/ }).first().click();
  await expect(page.getByRole('heading', { name: 'Add a product' })).toBeVisible();
  await expect(page.getByText('Choose a category and the rules appear here as you type.')).toBeVisible();

  // Required fields are enforced.
  await page.getByRole('button', { name: /^Add product/ }).last().click();
  await expect(page.getByText('Title is required.')).toBeVisible();
  await expect(page.getByText(/Price is required/)).toBeVisible();
  await expect(page.getByText(/Category is required/)).toBeVisible();
  await expect(page.getByLabel('TITLE', { exact: true })).toBeFocused();

  await page.getByLabel('TITLE', { exact: true }).fill('Custom message cake');
  await page.getByLabel('PRICE (AED)', { exact: true }).fill('free');
  await page.getByLabel('PRICE (AED)', { exact: true }).blur();
  await expect(page.getByText(/not a valid price/)).toBeVisible();
  await page.getByLabel('PRICE (AED)', { exact: true }).fill('220');
  await page.getByLabel('CATEGORY', { exact: true }).selectOption('cakes');

  // Tags: Enter adds, known tags are highlighted, suggestions add in one tap.
  const tags = page.locator('#pf-tags');
  await tags.fill('Custom');
  await tags.press('Enter');
  await page.getByRole('button', { name: '+ birthday' }).click();
  await tags.fill('my own label,');
  await expect(page.locator('.af-tag.known')).toHaveCount(2);
  await expect(page.locator('.af-tag').filter({ hasText: 'my-own-label' })).not.toHaveClass(/known/);

  await page.getByLabel('SHORT DESCRIPTION', { exact: true }).fill('Your message piped on a chocolate cake.');
  await page.getByLabel('IMAGE URL', { exact: true }).fill('/favicon.svg');
  await expect(page.locator('.af-thumb img')).toBeVisible();

  // The preview shows the rules the engine will use, all automatic.
  const preview = page.getByLabel('Preview');
  await expect(preview).toContainText('Custom message cake');
  await expect(preview).toContainText('AED 220');
  await expect(preview.locator('li').filter({ hasText: 'Matches interests' })).toContainText('Sweet treats');
  await expect(preview.locator('li').filter({ hasText: 'Occasion boost' })).toContainText('Birthday');
  await expect(preview.locator('li').filter({ hasText: 'Unlocked at' })).toContainText('Personal and up'); // "custom" tag
  await expect(preview.locator('li').filter({ hasText: 'Shown to budgets' })).toContainText('From AED 200 – 300 and above');
  await expect(preview.locator('li').filter({ hasText: 'Matches interests' }).locator('.af-auto')).toHaveText('Auto');
  await expect(preview.locator('.af-impact')).toContainText('Cakes: 0 → 1 gift');
  await expect(preview.locator('.af-impact')).toContainText('Better, but still: Only 1 Cakes item (minimum 2).');

  // Overriding a rule changes the preview and is marked as set by you.
  await page.getByText('Override the automatic rules').click();
  await page.getByRole('button', { name: 'Coffee', exact: true }).click();
  await expect(preview.locator('li').filter({ hasText: 'Matches interests' })).toContainText('Coffee');
  await expect(preview.locator('li').filter({ hasText: 'Matches interests' }).locator('.af-auto')).toHaveText('Set by you');
  await page.getByRole('button', { name: 'Reset to auto' }).first().click();
  await expect(preview.locator('li').filter({ hasText: 'Matches interests' })).toContainText('Sweet treats');
  await shot(page, '3-form');

  await page.getByRole('button', { name: /^Add product/ }).last().click();
  await expect(page.getByText(/Saved "Custom message cake"/)).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Products' })).toHaveAttribute('aria-selected', 'true');
  const row = page.locator('.pv-row').filter({ hasText: 'Custom message cake' });
  await expect(row).toContainText('Cakes · AED 220');
  await expect(row.locator('.b.draft')).toHaveText('Draft');
  await expect(row.locator('img.thumb-photo')).toBeVisible();
  await shot(page, '4-products');

  // The coverage dashboard moved on: Cakes is no longer empty, but still below the minimum.
  await page.getByRole('tab', { name: /Coverage/ }).click();
  await expect(page.locator('.cov-tile').filter({ hasText: 'Empty categories' })).toContainText('0');
  await expect(page.locator('.cov-tile').filter({ hasText: 'Gifts' }).first()).toContainText('56');
  await expect(page.locator('.cov-row').filter({ hasText: 'Cakes' })).toHaveClass(/low/);
  await expect(page.locator('.cov-alert').filter({ hasText: 'Only 1 Cakes item' })).toBeVisible();
  await expect(page.locator('.cov-alert.critical')).toHaveCount(0);

  // A second cake clears the category warning.
  await page.getByRole('tab', { name: 'Products' }).click();
  await page.getByRole('button', { name: /Add product/ }).first().click();
  await page.getByLabel('TITLE', { exact: true }).fill('Birthday cake for two');
  await page.getByLabel('PRICE (AED)', { exact: true }).fill('150');
  await page.getByLabel('CATEGORY', { exact: true }).selectOption('cakes');
  await expect(page.getByLabel('Preview').locator('.af-impact')).toContainText('Fixes: Only 1 Cakes item (minimum 2).');
  await page.getByRole('button', { name: /^Add product/ }).last().click();
  await page.getByRole('tab', { name: /Coverage/ }).click();
  await expect(page.locator('.cov-row').filter({ hasText: 'Cakes' })).toHaveClass(/ok/);
  await expect(page.locator('.cov-alert').filter({ hasText: 'Cakes item' })).toHaveCount(0);
  await shot(page, '5-coverage-after');
});

test('edit, delete, hide and restore products', async ({ page }) => {
  await unlock(page);
  await page.getByRole('tab', { name: 'Products' }).click();
  await page.getByRole('button', { name: /Add product/ }).first().click();
  await page.getByLabel('TITLE', { exact: true }).fill('Rose candle');
  await page.getByLabel('PRICE (AED)', { exact: true }).fill('90');
  await page.getByLabel('CATEGORY', { exact: true }).selectOption('candles');
  await page.getByRole('button', { name: /^Add product/ }).last().click();

  // Edit it.
  await page.locator('.pv-row').filter({ hasText: 'Rose candle' }).click();
  await expect(page.getByRole('heading', { name: 'Edit product' })).toBeVisible();
  await expect(page.getByLabel('TITLE', { exact: true })).toHaveValue('Rose candle');
  await page.getByLabel('PRICE (AED)', { exact: true }).fill('110');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.locator('.pv-row').filter({ hasText: 'Rose candle' })).toContainText('AED 110');

  // Delete needs two taps.
  await page.locator('.pv-row').filter({ hasText: 'Rose candle' }).click();
  await page.getByRole('button', { name: 'Delete this product' }).click();
  await expect(page.getByRole('button', { name: 'Tap again to confirm' })).toBeVisible();
  await page.getByRole('button', { name: 'Tap again to confirm' }).click();
  await expect(page.locator('.pv-row').filter({ hasText: 'Rose candle' })).toHaveCount(0);

  // Customise a built-in gift: your version replaces it; reset puts the original back.
  await page.locator('.pv-row').filter({ hasText: 'Specialty coffee' }).click();
  await expect(page.getByText('BUILT-IN GIFT')).toBeVisible();
  await page.getByLabel('PRICE (AED)', { exact: true }).fill('70');
  await page.getByRole('button', { name: 'Save changes' }).click();
  const coffee = page.locator('.pv-row').filter({ hasText: 'Specialty coffee' });
  await expect(coffee).toContainText('AED 70');
  await expect(coffee.locator('.b.edit')).toHaveText('Edited');
  await coffee.click();
  await page.getByRole('button', { name: 'Undo my edits (back to the built-in gift)' }).click();
  await page.getByRole('button', { name: 'Tap again to confirm' }).click();
  await expect(page.locator('.pv-row').filter({ hasText: 'Specialty coffee' })).toContainText('AED 65');

  // Hide a built-in gift, find it under Hidden, then show it again.
  await page.locator('.pv-row').filter({ hasText: 'Hand cream' }).click();
  await page.getByRole('button', { name: 'Delete this gift' }).click();
  await page.getByRole('button', { name: 'Tap again to confirm' }).click();
  await page.getByRole('button', { name: 'Deleted', exact: true }).click();
  const hidden = page.locator('.pv-row').filter({ hasText: 'Hand cream' });
  await expect(hidden.locator('.b.hide')).toBeVisible();
  await page.getByRole('tab', { name: /Coverage/ }).click();
  await expect(page.locator('.cov-tile').filter({ hasText: 'Gifts' }).first()).toContainText('54');
  await page.getByRole('tab', { name: 'Products' }).click();
  await page.getByRole('button', { name: 'Deleted', exact: true }).click();
  await hidden.click();
  await page.getByRole('button', { name: 'Restore this gift' }).click();
  await page.getByRole('tab', { name: /Coverage/ }).click();
  await expect(page.locator('.cov-tile').filter({ hasText: 'Gifts' }).first()).toContainText('55');
});

test('search and filters narrow the product list', async ({ page }) => {
  await unlock(page);
  await page.getByRole('tab', { name: 'Products' }).click();
  await expect(page.getByText('55 of 55 gifts')).toBeVisible();
  await page.getByLabel('Search products').fill('candle');
  await expect(page.locator('.pv-row')).toHaveCount(2);
  await page.getByLabel('Search products').fill('');
  await page.getByLabel('Filter by category').selectOption('tech');
  await expect(page.locator('.pv-row')).toHaveCount(5);
  await page.getByRole('button', { name: /^Yours/ }).click();
  await expect(page.getByText(/Tap "Add product" to add your first one/)).toBeVisible();
});

test('publish: copy the file, import a CSV with a bad row, discard drafts', async ({ page }) => {
  await unlock(page);
  await page.getByRole('tab', { name: 'Publish' }).click();
  await expect(page.locator('.pub-stats')).toContainText('0 drafts on this device');

  const csv = 'title,price,category,tags\nSoy candle,95,candles,soy-wax|luxury\nBad row,free,gadgets,\n"Eid sweets box",130,sweets,eid\n';
  await page.getByTestId('catalog-file').setInputFiles({ name: 'products.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) });
  const result = page.locator('.pub-result');
  await expect(result).toContainText('products.csv: 2 valid products, 1 row with problems');
  await expect(result.locator('pre')).toContainText('row 3 · price');
  await expect(result.locator('pre')).toContainText('row 3 · category');
  await page.getByRole('button', { name: 'Add 2 valid products as drafts' }).click();
  await expect(page.locator('.pub-stats')).toContainText('2 drafts on this device');
  await expect(page.getByText('Added 2 drafts.')).toBeVisible();

  await page.getByText('Show the file').click();
  const json = await page.getByLabel('catalog.custom.json contents').inputValue();
  expect(JSON.parse(json).map((p: { id: string }) => p.id)).toEqual(['soy-candle', 'eid-sweets-box']);
  await page.getByRole('button', { name: /Copy JSON/ }).click();
  await expect(page.getByText(/Copied|Copy was blocked/)).toBeVisible();

  await page.getByRole('button', { name: 'Discard 2 drafts' }).click();
  await page.getByRole('button', { name: 'Tap again to confirm' }).click();
  await expect(page.locator('.pub-stats')).toContainText('0 drafts on this device');
});

test('drafts survive a reload and are used by the gift engine on this device', async ({ page }) => {
  await unlock(page);
  await page.getByRole('tab', { name: 'Products' }).click();
  await page.getByRole('button', { name: /Add product/ }).first().click();
  await page.getByLabel('TITLE', { exact: true }).fill('Admin Test Cake');
  await page.getByLabel('PRICE (AED)', { exact: true }).fill('120');
  await page.getByLabel('CATEGORY', { exact: true }).selectOption('cakes');
  await page.getByText('Override the automatic rules').click();
  for (const i of ['Sweet treats', 'Coffee', 'Wellness']) await page.getByRole('button', { name: i, exact: true }).click();
  for (const v of ['Joyful', 'Elegant', 'Cozy']) await page.getByRole('button', { name: v, exact: true }).click();
  await page.getByRole('button', { name: 'Birthday', exact: true }).click();
  await page.getByRole('button', { name: /^Add product/ }).last().click();

  await page.reload();
  await page.getByRole('tab', { name: 'Products' }).click();
  await expect(page.locator('.pv-row').filter({ hasText: 'Admin Test Cake' })).toBeVisible();

  // Out in the app, the new cake is recommended for a matching buyer.
  await page.getByRole('button', { name: 'Lock' }).click();
  await page.getByRole('button', { name: 'Start Gift Match' }).click();
  await page.getByRole('button', { name: 'Friend' }).click();
  await page.getByRole('button', { name: 'Birthday' }).click();
  for (const i of ['Sweet treats', 'Coffee', 'Wellness']) await page.getByRole('button', { name: i }).click();
  await page.getByRole('button', { name: /Continue/ }).click();
  for (const v of ['Joyful', 'Elegant', 'Cozy']) await page.getByRole('button', { name: v }).click();
  await page.getByRole('button', { name: /Continue/ }).click();
  await page.getByRole('button', { name: /AED 200 – 300/ }).click();
  await page.getByRole('button', { name: /Thoughtful A beautifully/ }).click();
  await page.getByRole('button', { name: /Skip & find/ }).click();
  await expect(page.locator('.items').getByText('Admin Test Cake')).toBeVisible({ timeout: 10000 });
});

test('the login and admin fit a phone screen', async ({ page }) => {
  await unlock(page);
  for (const tab of ['Coverage', 'Products', 'Publish']) {
    await page.getByRole('tab', { name: new RegExp(tab) }).click();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, `${tab} must not scroll sideways`).toBeLessThanOrEqual(0);
  }
  await page.getByRole('tab', { name: 'Products' }).click();
  await page.getByRole('button', { name: /Add product/ }).first().click();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, 'form must not scroll sideways').toBeLessThanOrEqual(0);
});
