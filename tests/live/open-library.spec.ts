import { expect, test } from '@playwright/test';
import { keyboardActivate, records, save, stats } from '../browser/helpers';

for (const width of [1280, 320]) {
  test(`real Open Library reading journey at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const apiRequests: string[] = [];
    page.on('request', request => {
      if (request.url().startsWith('https://openlibrary.org/search.json')) apiRequests.push(request.url());
    });
    await page.goto('/discover');
    await page.getByRole('searchbox').fill('Dune');
    await page.getByRole('searchbox').press('Enter');
    await expect(page.getByRole('button', { name: /^Preview / }).first()).toBeVisible({ timeout: 15_000 });
    await keyboardActivate(page, page.getByRole('button', { name: /^Preview / }).first());
    const preview = page.getByRole('region', { name: /^Preview of / });
    const title = await preview.getByRole('heading').innerText();
    await keyboardActivate(page, page.getByRole('button', { name: 'Add to Library', exact: true }));
    await expect(page.getByRole('button', { name: 'Already in Library' })).toBeDisabled();
    await page.getByRole('combobox', { name: 'Search by', exact: true }).selectOption('author');
    await page.getByRole('searchbox').fill('Frank Herbert');
    await page.getByRole('searchbox').press('Enter');
    await expect(page.getByRole('button', { name: /^Preview / }).first()).toBeVisible({ timeout: 15_000 });
    await keyboardActivate(page, page.getByRole('button', { name: /^Preview / }).first());
    await expect(preview).toBeVisible();
    await page.goto('/library');
    await page.getByRole('searchbox').fill(title);
    await page.getByRole('combobox', { name: 'Reading status', exact: true }).selectOption('wantToRead');
    await page.getByRole('combobox', { name: 'Sort books', exact: true }).selectOption('rating');
    await keyboardActivate(page, page.getByRole('link', { name: title, exact: true }));
    await page.getByLabel('Total pages', { exact: true }).fill('400');
    await save(page, 'Save page count');
    await page.getByRole('combobox', { name: 'Status', exact: true }).selectOption('currentlyReading');
    await save(page, 'Save status');
    await page.getByLabel('Current page', { exact: true }).fill('120'); await save(page, 'Save progress');
    await expect(page.getByText('30% completed', { exact: true })).toBeVisible();
    await page.getByRole('combobox', { name: 'Rating', exact: true }).selectOption('5'); await save(page, 'Save rating');
    await save(page, 'Clear rating');
    await page.getByRole('combobox', { name: 'Rating', exact: true }).selectOption('4'); await save(page, 'Save rating');
    await page.getByLabel('Personal note').fill('Live verification note.'); await save(page, 'Save note');
    await save(page, 'Clear note');
    await page.getByLabel('Personal note').fill('Updated live verification note.'); await save(page, 'Save note');
    await page.getByLabel('Current page', { exact: true }).fill('400'); await save(page, 'Save progress');
    await expect(page.getByRole('combobox', { name: 'Status', exact: true })).toHaveValue('finished');
    await page.reload();
    await expect(page.getByLabel('Personal note')).toHaveValue('Updated live verification note.');
    await stats(page, 1, 1, 0, '4.0 of 5 stars');
    await page.goto(`/books/${(await records(page))[0].id}`);
    await keyboardActivate(page, page.getByRole('button', { name: `Remove ${title}`, exact: true }));
    await page.keyboard.press('Escape'); expect(await records(page)).toHaveLength(1);
    await keyboardActivate(page, page.getByRole('button', { name: `Remove ${title}`, exact: true }));
    await keyboardActivate(page, page.getByRole('button', { name: 'Confirm removal', exact: true }));
    await expect(page.getByText('Your bookshelf is empty.', { exact: false })).toBeVisible();
    await stats(page, 0, 0, 0, 'No ratings yet');
    expect(apiRequests).toHaveLength(2);
    for (const url of apiRequests) {
      expect(url).not.toContain('note'); expect(url).not.toContain('rating');
    }
    await page.screenshot({ path: `test-results/live-${width}.png`, fullPage: true });
  });
}
