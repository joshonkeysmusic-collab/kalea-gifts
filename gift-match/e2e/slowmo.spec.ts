import { test } from '@playwright/test';

test('slow-motion filmstrips', async ({ page, context }) => {
  test.skip(!process.env.FILM, 'set FILM=1 to record filmstrips');
  await page.goto('/');
  await page.getByRole('button', { name: 'Start Gift Match' }).click();
  await page.getByRole('button', { name: 'Friend' }).click();
  await page.getByRole('button', { name: 'Birthday' }).click();
  await page.getByRole('button', { name: 'Coffee' }).click();
  await page.getByRole('button', { name: 'Self-care' }).click();
  await page.getByRole('button', { name: /Continue/ }).click();
  await page.getByRole('button', { name: 'Cozy' }).click();
  await page.waitForTimeout(800);

  const cdp = await context.newCDPSession(page);
  await cdp.send('Animation.enable');
  await cdp.send('Animation.setPlaybackRate', { playbackRate: 0.12 });
  await page.getByRole('button', { name: /Continue/ }).click({ noWaitAfter: true, force: true });
  for (const t of [0, 400, 1000, 1800, 2800, 4200]) {
    await page.screenshot({ path: `screenshots/slow/a-step-${String(t).padStart(4, '0')}.png` });
    await page.waitForTimeout(t === 0 ? 400 : 600);
  }
  await cdp.send('Animation.setPlaybackRate', { playbackRate: 1 });
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: /AED 200 – 300/ }).click();
  await page.getByRole('button', { name: /Personal More/ }).click();
  await page.getByRole('button', { name: /Skip & find/ }).click();
  await page.waitForTimeout(2550);
  await cdp.send('Animation.setPlaybackRate', { playbackRate: 0.15 });
  for (const t of [0, 1000, 2000, 3000, 4500, 6000, 8000]) {
    await page.screenshot({ path: `screenshots/slow/b-reveal-${String(t).padStart(4, '0')}.png` });
    await page.waitForTimeout(1000);
  }
});

test('recipient unwrapping filmstrip', async ({ page }) => {
  test.skip(!process.env.FILM, 'set FILM=1 to record filmstrips');
  const link = { v: 1, n: 'Sarah', f: 'Jo', t: 'The Cozy Coffee Box', i: ['beans', 'candle', 'silk-mask', 'wrap', 'card'], m: 'Love you', o: 'birthday', s: 'abc123' };
  const b64 = Buffer.from(JSON.stringify(link)).toString('base64url');
  await page.goto(`/#/r/${b64}`);
  await page.waitForTimeout(1800);
  await page.getByRole('button', { name: 'Open your gift' }).click({ noWaitAfter: true });
  for (const t of [0, 1, 2, 3, 4, 5, 6, 7]) {
    await page.screenshot({ path: `screenshots/slow2/c-unwrap-${String(t * 220).padStart(4, '0')}.png` });
    await page.waitForTimeout(120);
  }
});
