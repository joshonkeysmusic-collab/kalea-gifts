import { expect, test, type Page } from '@playwright/test';

const shot = (page: Page, name: string) => page.screenshot({ path: `screenshots/${name}.png`, fullPage: true, animations: 'disabled' });

async function noHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, 'page must not scroll sideways').toBeLessThanOrEqual(0);
}

async function answerQuestions(page: Page, opts: { name?: string; message?: string } = {}) {
  await page.getByRole('button', { name: 'Start Gift Match' }).click();
  await expect(page.getByRole('heading', { name: 'Who is this gift for?' })).toBeVisible();
  await page.getByRole('button', { name: 'Partner' }).click();
  await expect(page.getByRole('heading', { name: 'What is the occasion?' })).toBeVisible();
  await page.getByRole('button', { name: 'Birthday' }).click();
  await expect(page.getByRole('heading', { name: 'What are they into?' })).toBeVisible();
  await page.getByRole('button', { name: 'Coffee' }).click();
  await page.getByRole('button', { name: 'Self-care' }).click();
  await page.getByRole('button', { name: 'Home / calm evenings' }).click();
  await page.getByRole('button', { name: /Continue · 3 selected/ }).click();
  await expect(page.getByRole('heading', { name: 'What kind of vibe suits them?' })).toBeVisible();
  await page.getByRole('button', { name: 'Cozy' }).click();
  await page.getByRole('button', { name: 'Elegant' }).click();
  await page.getByRole('button', { name: /Continue/ }).click();
  await expect(page.getByRole('heading', { name: 'What is your budget?' })).toBeVisible();
  await page.getByRole('button', { name: /AED 200 – 300/ }).click();
  await expect(page.getByRole('heading', { name: 'How personal do you want to make it?' })).toBeVisible();
  await page.getByRole('button', { name: /Personal More tailored/ }).click();
  await expect(page.getByRole('heading', { name: 'Make it personal' })).toBeVisible();
  if (opts.name) await page.getByPlaceholder('e.g. Sarah').fill(opts.name);
  if (opts.message) await page.getByPlaceholder(/Write a short note/).fill(opts.message);
}

test('full giver journey, then recipient reveal from the shared link', async ({ page, context }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Start Gift Match' })).toBeVisible();
  await noHorizontalScroll(page);
  await shot(page, '01-welcome');

  await answerQuestions(page, { name: 'Sarah', message: 'Happy birthday, love' });
  await page.getByRole('button', { name: 'Find my gift match' }).click();
  await expect(page.getByText(/Finding Sarah's gift/)).toBeVisible();

  await expect(page.getByRole('heading', { name: "Here's a match for Sarah" })).toBeVisible({ timeout: 8000 });
  await expect(page.getByText('Happy birthday, love')).toBeVisible();
  const total = Number(await page.locator('.price').getAttribute('data-total'));
  expect(total).toBeGreaterThan(0);
  expect(total).toBeLessThanOrEqual(300);
  await expect(page.locator('.price'), 'price counts up to the real total').toHaveText(`AED ${total}`);
  await noHorizontalScroll(page);
  await shot(page, '09-result');

  const before = await page.locator('.items').innerText();
  let changed = false;
  for (let i = 0; i < 4 && !changed; i++) {
    await page.getByRole('button', { name: 'Try another match' }).click();
    await page.waitForTimeout(600); // scatter, then the new box drops in
    changed = (await page.locator('.items').innerText()) !== before;
  }
  expect(changed, 'shuffle should produce a different box').toBe(true);

  await page.getByRole('button', { name: /Order this box/ }).click();
  await expect(page.getByRole('heading', { name: /Would you order this for Sarah/ })).toBeVisible();
  await expect(page.getByText('FINAL STEP')).toBeVisible();
  await expect(page.getByRole('button', { name: /Lock in my answer/ })).toHaveCount(0);
  await page.getByRole('button', { name: /Yes, I'd order it/ }).click();
  await expect(page.getByText('WHAT MADE IT FEEL RIGHT?')).toBeVisible();
  await noHorizontalScroll(page);
  await page.getByPlaceholder('One line is plenty…').fill('Love the candle');
  await shot(page, '10-intent');
  await page.getByRole('button', { name: /Lock in my answer/ }).click();

  await expect(page.getByRole('heading', { name: 'Now, did you predict it right?' })).toBeVisible();
  await page.getByPlaceholder("So they know it's from you").fill('Jo');
  // The giver can preview the recipient experience, then come back.
  await page.getByRole('button', { name: 'Preview what Sarah will see' }).click();
  await expect(page.getByText("Jo picked something they think you'll love")).toBeVisible();
  await page.getByRole('button', { name: 'Back to your match' }).click();
  await expect(page.getByRole('heading', { name: 'Now, did you predict it right?' })).toBeVisible();
  await expect(page.getByPlaceholder("So they know it's from you")).toHaveValue('Jo');
  await page.evaluate(() => Object.defineProperty(navigator, 'share', { value: undefined }));
  await page.getByRole('button', { name: 'Send to Sarah' }).click();
  await expect(page.getByText(/Link copied/)).toBeVisible();
  await shot(page, '11-share');
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  const url = clip.match(/https?:\/\/\S+/)![0];
  expect(url).toContain('#/r/');

  // Recipient opens the link on their own phone.
  const them = await context.newPage();
  await them.goto(url);
  await expect(them.getByText('Jo picked something they think you\'ll love')).toBeVisible();
  await expect(them.getByRole('button', { name: 'Back to your match' })).toHaveCount(0);
  await shot(them, 'R1-recipient-closed');
  await them.getByRole('button', { name: 'Open your gift' }).click();
  await expect(them.getByText('Did they get it right?')).toBeVisible();
  await expect(them.locator('.item-price')).toHaveCount(0); // no prices for the recipient
  await expect(them.getByRole('button', { name: /Send my answer/ })).toBeDisabled();
  await them.getByRole('button', { name: 'Love it' }).click();
  await shot(them, 'R2-recipient-open');
  await them.getByRole('button', { name: /Send my answer/ }).click();
  await expect(them.getByRole('heading', { name: 'Thank you, Sarah!' })).toBeVisible();
  await expect(them.getByRole('button', { name: 'Tell Jo' })).toBeVisible();
  await shot(them, 'R3-recipient-done');

  // Their turn: the loop brings them into a fresh flow, flagged as invited.
  await them.getByRole('link', { name: /Make a match/ }).click();
  await expect(them.getByText('Sarah challenged you')).toBeVisible();

  expect(errors).toEqual([]);
});

test('back navigation keeps answers and every step renders cleanly', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Start Gift Match' }).click();
  await shot(page, '02-who');
  await page.getByRole('button', { name: 'Friend' }).click();
  await shot(page, '03-occasion');
  await page.getByRole('button', { name: 'Thank You' }).click();
  await expect(page.getByRole('button', { name: /Pick at least one/ })).toBeDisabled();
  await page.getByRole('button', { name: 'Books' }).click();
  await shot(page, '04-interests');
  await page.getByRole('button', { name: /Continue/ }).click();
  await page.getByRole('button', { name: 'Natural' }).click();
  await shot(page, '05-vibes');

  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page.getByRole('button', { name: 'Books' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Back' }).click();
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page.getByRole('button', { name: 'Friend' })).toBeVisible();

  // Vibe limit: picking a 4th replaces the oldest.
  await page.getByRole('button', { name: 'Friend' }).click();
  await page.getByRole('button', { name: 'Thank You' }).click();
  await page.getByRole('button', { name: /Continue/ }).click();
  for (const v of ['Cozy', 'Joyful', 'Minimal']) await page.getByRole('button', { name: v }).click();
  await expect(page.locator('.pt-slide > .pt-current .tile.on')).toHaveCount(3);
  await page.getByRole('button', { name: /Continue · 3 selected/ }).click();
  await shot(page, '06-budget');
  await page.getByRole('button', { name: /Under AED 100/ }).click();
  await shot(page, '07-hearts');
  await page.getByRole('button', { name: /Thoughtful A beautifully/ }).click();
  await shot(page, '08-details');
  await page.getByRole('button', { name: /Skip & find my match/ }).click();
  await expect(page.getByRole('heading', { name: "Here's a match for your friend" })).toBeVisible({ timeout: 8000 });
  const total = Number(await page.locator('.price').getAttribute('data-total'));
  expect(total).toBeLessThanOrEqual(100);

  // Refresh mid-journey keeps the result.
  await page.reload();
  await expect(page.getByRole('heading', { name: "Here's a match for your friend" })).toBeVisible();
  await noHorizontalScroll(page);
});

test('photo upload unlocks photo gifts at the highest heart level', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Start Gift Match' }).click();
  await page.getByRole('button', { name: 'Partner' }).click();
  await page.getByRole('button', { name: 'Anniversary' }).click();
  await page.getByRole('button', { name: 'Home / calm evenings' }).click();
  await page.getByRole('button', { name: /Continue/ }).click();
  await page.getByRole('button', { name: 'Romantic' }).click();
  await page.getByRole('button', { name: /Continue/ }).click();
  await page.getByRole('button', { name: /AED 300 – 500/ }).click();
  await page.getByRole('button', { name: /Made for Them/ }).click();
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
  await page.getByTestId('photo-input').setInputFiles({ name: 'us.png', mimeType: 'image/png', buffer: png });
  await expect(page.getByAltText('Your upload')).toBeVisible();
  await page.getByRole('button', { name: 'Find my gift match' }).click();
  await expect(page.getByRole('heading', { name: /Here's a match/ })).toBeVisible({ timeout: 8000 });
  await expect(page.locator('.tag').first()).toHaveText('Personal');
  await expect(page.locator('.note-photo')).toBeVisible();
});

test('founder view summarises this device\'s sessions', async ({ page }) => {
  await page.goto('/');
  await answerQuestions(page);
  await page.getByRole('button', { name: /find my match/i }).click();
  await expect(page.getByRole('heading', { name: /Here's a match/ })).toBeVisible({ timeout: 8000 });
  await page.getByRole('button', { name: /Order this box/ }).click();
  await page.getByRole('button', { name: /Maybe, with changes/ }).click();
  await page.getByRole('button', { name: /Lock in my answer/ }).click();

  await page.goto('/#/founder');
  await expect(page.getByRole('heading', { name: 'Kalea Gifts Insights' })).toBeVisible();
  await expect(page.getByText('This device only')).toBeVisible();
  await expect(page.locator('.f-kpi').first()).toContainText('1');
  await expect(page.locator('.f-kpi').nth(2)).toContainText('100%');
  await expect(page.getByText('Coffee', { exact: true })).toBeVisible();
  await noHorizontalScroll(page);
  await shot(page, 'F-founder');
});

test('a broken share link falls back to the normal app', async ({ page }) => {
  await page.goto('/#/r/not-a-real-payload!!');
  await expect(page.getByRole('button', { name: 'Start Gift Match' })).toBeVisible();
});

test('pages transition: outgoing layer is hidden from assistive tech, then removed', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Start Gift Match' }).click();
  await expect(page.getByRole('heading', { name: 'Who is this gift for?' })).toBeVisible();
  await page.getByRole('button', { name: 'Partner' }).click();
  // Selection is confirmed before advancing.
  await expect(page.getByRole('button', { name: 'Partner' })).toHaveClass(/on/);
  const exit = page.locator('.pt-slide > .pt-exit');
  await expect(exit).toHaveCount(1, { timeout: 2000 });
  await expect(exit).toHaveAttribute('aria-hidden', 'true');
  await expect(exit).toHaveAttribute('inert', '');
  await expect(page.getByRole('heading', { name: 'What is the occasion?' })).toBeVisible();
  await expect(exit).toHaveCount(0);
  // Going back uses the reverse direction.
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page.locator('.pt-slide.pt-back')).toHaveCount(1);
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('the whole flow still works without animation', async ({ page }) => {
    await page.goto('/');
    await answerQuestions(page, { name: 'Ali' });
    await page.getByRole('button', { name: 'Find my gift match' }).click();
    await expect(page.getByRole('heading', { name: "Here's a match for Ali" })).toBeVisible({ timeout: 8000 });
    await expect(page.locator('.price')).toHaveText(/AED [1-9]/);
  });
});

test('birthday opens a calendar pop-up and shows the countdown', async ({ page }) => {
  await page.goto('/');
  await answerQuestions(page, { name: 'Maya' });
  await page.getByRole('button', { name: /Birthday: choose a date/ }).click();
  const sheet = page.getByRole('dialog', { name: 'Choose their birthday' });
  await expect(sheet).toBeVisible();
  const month = await sheet.locator('.cal-month').innerText();
  await sheet.getByRole('button', { name: 'Next month' }).click();
  await expect(sheet.locator('.cal-month')).not.toHaveText(month);
  const next = await sheet.locator('.cal-month').innerText();
  await sheet.getByRole('button', { name: `14 ${next}`, exact: true }).click();
  await expect(sheet.getByText(/until their birthday, a \w+day/)).toBeVisible();
  await shot(page, '08b-calendar');
  await sheet.getByRole('button', { name: `Set 14 ${next.slice(0, 3)}` }).click();
  await expect(sheet).toHaveCount(0);
  await expect(page.getByRole('button', { name: `Birthday: 14 ${next}` })).toBeVisible();
  await expect(page.getByText(/In \d+ days · a \w+day/)).toBeVisible();
  // The birthday flows through to the order ticket.
  await page.getByRole('button', { name: 'Find my gift match' }).click();
  await page.getByRole('button', { name: /Order this box/ }).click({ timeout: 10000 });
  await expect(page.locator('.ticket')).toContainText(`Birthday, 14 ${next}`);
  await shot(page, '10-order');
});

test('a product from catalog.custom.json is recommended and shown with its photo', async ({ page }) => {
  await page.route('**/catalog.custom.json', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 'e2e-cake', title: 'E2E Test Cake', blurb: 'Loaded from the admin file.', price: 120, category: 'cakes', imageUrl: '/favicon.svg', interests: ['treats', 'coffee', 'wellness'], vibes: ['joyful', 'elegant', 'cozy'], occasions: ['birthday'] },
        { id: 'bad', title: 'Broken row', price: 'free', category: 'cakes' }, // skipped, must not break the rest
      ]),
    }),
  );
  await page.goto('/');
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
  await expect(page.getByRole('heading', { name: /Here's a match/ })).toBeVisible({ timeout: 10000 });
  await expect(page.locator('.items').getByText('E2E Test Cake')).toBeVisible();
  await expect(page.locator('.items img.thumb-photo[src="/favicon.svg"]')).toBeVisible();
  await expect(page.locator('.items').getByText('Broken row')).toHaveCount(0);
});

test('the app still starts when the catalogue file is broken or unreachable', async ({ page }) => {
  await page.route('**/catalog.custom.json', (route) => route.fulfill({ contentType: 'text/html', body: '<html>not json' }));
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Start Gift Match' })).toBeVisible();
  await page.unroute('**/catalog.custom.json');
  await page.route('**/catalog.custom.json', (route) => route.abort());
  await page.reload();
  await expect(page.getByRole('button', { name: 'Start Gift Match' })).toBeVisible({ timeout: 5000 });
});
