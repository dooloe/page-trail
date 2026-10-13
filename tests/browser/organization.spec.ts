import { expect, test } from '@playwright/test';
import { fixture, records, save, seed, stats } from './helpers';

test('title/author search, combined statuses, stable sorting, no-match recovery and reactive changes', async ({ page, context }) => {
  let searches = 0;
  page.on('request', request => { if (request.url().startsWith('https://openlibrary.org/search.json')) searches++; });
  await seed(page, [
    fixture({ id: 'z', sourceWorkId: 'OL1W', title: 'Alpha', rating: 3 }),
    fixture({ id: 'a', sourceWorkId: 'OL2W', title: 'Alpha', authors: ['Other Writer'], rating: 3, status: 'finished' }),
    fixture({ id: 'b', sourceWorkId: 'OL3W', title: 'Beta', rating: null, status: 'currentlyReading' }),
    fixture({ id: 'c', sourceWorkId: 'OL4W', title: 'Gamma', rating: 5, authors: ['Other Writer'] }),
  ]);
  await page.goto('/library');
  const links = page.locator('article h2 a');
  await expect(links).toHaveText(['Alpha', 'Alpha', 'Beta', 'Gamma']);
  expect(await links.evaluateAll(items => items.map(item => item.getAttribute('href')))).toEqual(['/books/a', '/books/z', '/books/b', '/books/c']);
  await page.getByRole('combobox', { name: 'Sort books', exact: true }).selectOption('rating');
  await expect(links).toHaveText(['Gamma', 'Alpha', 'Alpha', 'Beta']);
  await page.getByRole('searchbox').fill('oThEr'); await expect(links).toHaveText(['Gamma', 'Alpha']);
  await page.getByRole('combobox', { name: 'Reading status', exact: true }).selectOption('finished');
  await expect(links).toHaveText(['Alpha']);
  await page.getByRole('searchbox').fill('missing'); await expect(page.getByRole('status')).toContainText('No books match');
  await page.getByRole('button', { name: 'Clear search and filter' }).click();
  await expect(links).toHaveCount(4);
  await page.getByRole('searchbox').fill('ALPHA'); await expect(links).toHaveCount(2);
  await page.getByRole('combobox', { name: 'Reading status', exact: true }).selectOption('wantToRead');
  await expect(links).toHaveCount(1);
  // A second app page uses the real repository; subscribers must update without reload.
  const editor = await context.newPage(); await editor.goto('/books/z');
  await editor.getByRole('combobox', { name: 'Status', exact: true }).selectOption('finished');
  await save(editor, 'Save status');
  await expect(links).toHaveCount(0);
  await page.getByRole('button', { name: 'Clear search and filter' }).click();
  await expect(links).toHaveCount(4);
  await editor.getByRole('button', { name: 'Remove Alpha', exact: true }).click();
  await editor.getByRole('button', { name: 'Confirm removal' }).click();
  await expect(links).toHaveCount(3);
  expect((await records(page)).map(book => book.id).sort()).toEqual(['a', 'b', 'c']);
  await page.reload(); await expect(links).toHaveCount(3);
  await stats(page, 3, 1, 1, '4.0 of 5 stars');
  expect(searches).toBe(0); await editor.close();
});
