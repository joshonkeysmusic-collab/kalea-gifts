import { test, type Page } from '@playwright/test';

/** Filmstrips of key transitions for visual review (not assertions). */
async function film(page: Page, name: string, act: () => Promise<void>, at = [0, 90, 180, 300, 500, 900]) {
  const start = Date.now();
  const p = act();
  for (const t of at) {
    const wait = t - (Date.now() - start);
    if (wait > 0) await page.waitForTimeout(wait);
    await page.screenshot({ path: `screenshots/motion/${name}-${String(t).padStart(4, '0')}.png` });
  }
  await p;
}

test('capture transition filmstrips', async ({ page }) => {
  test.skip(!process.env.FILM, 'set FILM=1 to record filmstrips');
  await page.goto('/');
  await page.waitForTimeout(1600);
  await film(page, 'a-welcome-start', () => page.getByRole('button', { name: 'Start Gift Match' }).click({ noWaitAfter: true }), [0, 200, 400, 650, 850, 1100, 1500]);
  await page.waitForTimeout(600);
  await film(page, 'b-select-advance', () => page.getByRole('button', { name: 'Partner' }).click(), [0, 150, 360, 450, 600, 800, 1100]);
  await page.getByRole('button', { name: 'Birthday' }).click();
  await page.getByRole('button', { name: 'Coffee' }).click();
  await page.getByRole('button', { name: 'Flowers' }).click();
  await page.getByRole('button', { name: /Continue/ }).click();
  await page.getByRole('button', { name: 'Romantic' }).click();
  await page.getByRole('button', { name: /Continue/ }).click();
  await page.getByRole('button', { name: /AED 300 – 500/ }).click();
  await page.getByRole('button', { name: /Made for Them/ }).click();
  await page.getByPlaceholder('e.g. Sarah').fill('Maya');
  await page.getByRole('button', { name: 'Find my gift match' }).click();
  await film(page, 'c-matching', async () => {}, [300, 1200, 2200]);
  await film(page, 'd-result-reveal', async () => {}, [2800, 3100, 3400, 3800, 4400]);
  await page.waitForTimeout(800);
  await film(page, 'e-shuffle', () => page.getByRole('button', { name: 'Try another match' }).click(), [0, 150, 300, 500, 800, 1300]);
});
