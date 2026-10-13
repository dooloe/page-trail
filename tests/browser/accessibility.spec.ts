import { expect, test } from '@playwright/test';
import { fixture, keyboardActivate, mockSearch, noOverflow, records, seed } from './helpers';

for (const width of [320, 768, 1280]) {
  test(`all pages and long metadata remain readable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const longTitle = 'A very long book title '.repeat(10) + 'UnbrokenTitle'.repeat(20);
    await seed(page, [fixture({ title: longTitle, authors: ['A long author name '.repeat(8), 'Second author'],
      status: 'currentlyReading', currentPage: 120, rating: 4 }),
    fixture({ id: 'two', sourceWorkId: 'OL2W', title: 'Missing metadata', authors: [], totalPages: null })]);
    await mockSearch(page, [{ key: 'OL3W', title: longTitle, author_name: ['One', 'Two'] }]);
    for (const route of ['/', '/library', '/discover', '/books/one', '/books/two', '/books/absent', '/not-found']) {
      await page.goto(route); await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      if (route === '/discover') {
        await page.getByRole('searchbox').fill('long title'); await page.getByRole('searchbox').press('Enter');
        await page.getByRole('button', { name: /^Preview / }).click();
      }
      await noOverflow(page);
      const controls = page.locator('button, input, select, textarea');
      for (const control of await controls.all()) {
        const box = await control.boundingBox();
        if (box) { expect(box.x).toBeGreaterThanOrEqual(0); expect(box.x + box.width).toBeLessThanOrEqual(width + 1); }
      }
      await page.screenshot({ path: `test-results/review-${width}-${route.replaceAll('/', '_') || 'dashboard'}.png`, fullPage: true });
    }
  });
}

for (const width of [320, 1280]) {
  test(`complete keyboard journey including modal cancellation/removal at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 }); await mockSearch(page); await page.goto('/discover');
    await expect(page.getByRole('heading', { name: 'Discover Books' })).toBeVisible();
    await page.keyboard.press('Tab'); await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
    expect(await page.getByRole('link', { name: 'Skip to content' }).evaluate(element => getComputedStyle(element).outlineWidth)).toBe('3px');
    await page.keyboard.press('Enter'); await expect(page.getByRole('main')).toBeFocused();
    await page.keyboard.press('Tab'); await expect(page.getByRole('combobox', { name: 'Search by', exact: true })).toBeFocused();
    await page.keyboard.press('Tab'); await expect(page.getByRole('searchbox')).toBeFocused();
    await page.keyboard.type('Dune'); await page.keyboard.press('Enter');
    await keyboardActivate(page, page.getByRole('button', { name: 'Preview Dune' }));
    await expect(page.getByRole('region', { name: 'Preview of Dune' }).getByRole('heading')).toBeFocused();
    await page.keyboard.press('Tab'); await expect(page.getByRole('button', { name: 'Add to Library', exact: true })).toBeFocused();
    await page.keyboard.press('Enter'); await expect(page.getByRole('button', { name: 'Already in Library' })).toBeDisabled();
    await keyboardActivate(page, page.getByRole('button', { name: 'Close preview' }));
    await expect(page.getByRole('button', { name: 'Preview Dune' })).toBeFocused();
    await keyboardActivate(page, page.getByRole('link', { name: 'My Library', exact: true }));
    await expect(page.getByRole('main')).toBeFocused();
    await expect(page.getByRole('searchbox')).toBeVisible();
    await page.keyboard.press('Tab'); await expect(page.getByRole('searchbox')).toBeFocused();
    await page.keyboard.type('HERBERT');
    await page.keyboard.press('Tab'); await expect(page.getByRole('combobox', { name: 'Reading status', exact: true })).toBeFocused();
    await page.keyboard.press('Home');
    await page.keyboard.press('Tab'); await expect(page.getByRole('combobox', { name: 'Sort books', exact: true })).toBeFocused();
    await page.keyboard.press('End');
    await page.keyboard.press('Tab'); await expect(page.getByRole('link', { name: 'Dune', exact: true })).toBeFocused();
    await page.keyboard.press('Enter');
    const status = page.getByRole('combobox', { name: 'Status', exact: true });
    await status.focus(); await page.keyboard.press('ArrowDown');
    await keyboardActivate(page, page.getByRole('button', { name: 'Save status' }));
    await expect(page.getByLabel('Current page', { exact: true })).toBeVisible();
    await page.getByLabel('Total pages', { exact: true }).focus(); await page.keyboard.press('ControlOrMeta+A'); await page.keyboard.type('500');
    await keyboardActivate(page, page.getByRole('button', { name: 'Save page count' }));
    await expect(page.getByText('0 of 500 pages')).toBeVisible();
    await page.getByLabel('Current page', { exact: true }).focus(); await page.keyboard.press('ControlOrMeta+A'); await page.keyboard.type('125');
    await keyboardActivate(page, page.getByRole('button', { name: 'Save progress' }));
    await expect(page.getByText('25% completed', { exact: true })).toBeVisible();
    const rating = page.getByRole('combobox', { name: 'Rating', exact: true });
    await rating.focus(); await page.keyboard.press('End');
    await keyboardActivate(page, page.getByRole('button', { name: 'Save rating' }));
    await expect(page.getByText('Saved rating: 5 of 5 stars')).toBeVisible();
    await page.getByLabel('Personal note').focus(); await page.keyboard.type('Keyboard note\nSecond line');
    await keyboardActivate(page, page.getByRole('button', { name: 'Save note' }));
    await expect.poll(async () => (await records(page))[0].note).toBe('Keyboard note\nSecond line');
    await keyboardActivate(page, page.getByRole('button', { name: 'Clear rating' }));
    await expect(page.getByText('Not rated yet', { exact: true })).toBeVisible();
    await keyboardActivate(page, page.getByRole('button', { name: 'Clear note' }));
    await expect(page.getByText('No note saved yet.')).toBeVisible();
    await keyboardActivate(page, page.getByRole('button', { name: 'Remove Dune', exact: true }));
    await expect(page.getByRole('button', { name: 'Keep book' })).toBeFocused();
    await page.keyboard.press('Tab'); await expect(page.getByRole('button', { name: 'Confirm removal' })).toBeFocused();
    await page.keyboard.press('Tab'); await expect(page.getByRole('button', { name: 'Keep book' })).toBeFocused();
    await page.keyboard.press('Escape'); await expect(page.getByRole('button', { name: 'Remove Dune', exact: true })).toBeFocused();
    await keyboardActivate(page, page.getByRole('button', { name: 'Remove Dune', exact: true }));
    await page.keyboard.press('Tab'); await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/library$/);
    await expect(page.getByText('Your bookshelf is empty.', { exact: false })).toBeVisible();
    await noOverflow(page);
  });
}
