import { expect, test } from '@playwright/test';
import { failNextWrite, fixture, records, save, seed, stats, mockSearch, searchPattern } from './helpers';

test('progress validation, failed retry, joint correction, completion and manual status preservation', async ({ page }) => {
  const original = fixture({ status: 'currentlyReading', currentPage: 120, rating: 5, note: 'Keep this note.' });
  await seed(page, [original]); await page.goto('/books/one');
  await expect(page.getByText('30% completed', { exact: true })).toBeVisible();
  await expect(page.getByRole('progressbar')).toHaveAttribute('value', '120');
  await expect(page.getByRole('progressbar')).toHaveAttribute('max', '400');
  for (const invalid of ['-1', '1.5', '401']) {
    await page.getByLabel('Current page', { exact: true }).fill(invalid);
    await page.getByRole('button', { name: 'Save progress' }).click();
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByLabel('Current page', { exact: true })).toHaveValue(invalid);
    expect(await records(page)).toEqual([original]);
  }
  await page.getByLabel('Current page', { exact: true }).fill('0'); await save(page, 'Save progress');
  await expect(page.getByText('0% completed', { exact: true })).toBeVisible();
  await page.getByLabel('Current page', { exact: true }).fill('120');
  await failNextWrite(page, 'put');
  await page.getByRole('button', { name: 'Save progress' }).click();
  await expect(page.getByRole('alert')).toContainText('Could not save');
  await expect(page.getByLabel('Current page', { exact: true })).toHaveValue('120');
  expect((await records(page))[0].currentPage).toBe(0);
  await save(page, 'Save progress');
  for (const invalid of ['0', '-2', '1.5']) {
    await page.getByLabel('Total pages', { exact: true }).fill(invalid);
    await page.getByRole('button', { name: 'Save page count' }).click();
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByLabel('Total pages', { exact: true })).toHaveValue(invalid);
    expect((await records(page))[0].totalPages).toBe(400);
  }
  await page.getByLabel('Total pages', { exact: true }).fill('100');
  await page.getByRole('button', { name: 'Save page count' }).click();
  await expect(page.getByRole('alert')).toContainText('exceeds');
  await page.getByLabel('Corrected current page', { exact: true }).fill('90');
  await failNextWrite(page, 'put');
  await page.getByRole('button', { name: 'Save page count' }).click();
  await expect(page.getByRole('alert')).toContainText('Could not save');
  await expect(page.getByLabel('Total pages', { exact: true })).toHaveValue('100');
  await expect(page.getByLabel('Corrected current page', { exact: true })).toHaveValue('90');
  await save(page, 'Save page count');
  await page.reload(); await expect(page.getByText('90% completed', { exact: true })).toBeVisible();
  await page.getByLabel('Total pages', { exact: true }).fill('90'); await save(page, 'Save page count');
  await expect(page.getByRole('combobox', { name: 'Status', exact: true })).toHaveValue('finished');
  await stats(page, 1, 1, 0, '5.0 of 5 stars');
  await page.goto('/books/one');
  for (const status of ['wantToRead', 'currentlyReading', 'finished', 'currentlyReading']) {
    const before = (await records(page))[0];
    await page.getByRole('combobox', { name: 'Status', exact: true }).selectOption(status);
    await save(page, 'Save status');
    expect((await records(page))[0]).toEqual({ ...before, status, updatedAt: expect.any(Number) });
  }
  await failNextWrite(page, 'put');
  await page.getByRole('combobox', { name: 'Status', exact: true }).selectOption('wantToRead');
  await page.getByRole('button', { name: 'Save status' }).click();
  await expect(page.getByRole('alert')).toContainText('Could not save');
  expect((await records(page))[0].status).toBe('currentlyReading');
  await expect(page.getByRole('combobox', { name: 'Status', exact: true })).toHaveValue('wantToRead');
  await save(page, 'Save status');
  await page.getByRole('combobox', { name: 'Status', exact: true }).selectOption('currentlyReading'); await save(page, 'Save status');
  await page.getByRole('combobox', { name: 'Rating', exact: true }).selectOption('1'); await save(page, 'Save rating');
  expect((await records(page))[0].status).toBe('currentlyReading');
  await page.getByLabel('Current page', { exact: true }).fill('90'); await save(page, 'Save progress');
  await expect(page.getByRole('combobox', { name: 'Status', exact: true })).toBeFocused();
  const completed = (await records(page))[0];
  expect(completed).toMatchObject({ status: 'finished', currentPage: 90, totalPages: 90, note: original.note, createdAt: original.createdAt });
  expect(completed).not.toHaveProperty('percentage');
  await page.reload(); await expect(page.getByRole('combobox', { name: 'Status', exact: true })).toHaveValue('finished');
});

for (const status of ['wantToRead', 'currentlyReading', 'finished'] as const) {
  test(`joint correction, ratings 1–5 and note create/edit/clear for ${status}`, async ({ page }) => {
    const original = fixture({ status, currentPage: 20 });
    await seed(page, [original]); await page.goto('/books/one');
    await page.getByLabel('Total pages', { exact: true }).fill('10');
    await page.getByLabel('Corrected current page', { exact: true }).fill('10');
    await save(page, 'Save page count');
    const expectedStatus = status === 'currentlyReading' ? 'finished' : status;
    expect((await records(page))[0]).toMatchObject({ totalPages: 10, currentPage: 10, status: expectedStatus });
    // Restore the original manual status to test ratings/notes at 100% without automatic completion.
    await page.getByRole('combobox', { name: 'Status', exact: true }).selectOption(status); await save(page, 'Save status');
    for (const rating of [1, 2, 3, 4, 5]) {
      await page.getByRole('combobox', { name: 'Rating', exact: true }).selectOption(String(rating));
      await save(page, 'Save rating');
      expect((await records(page))[0]).toMatchObject({ rating, status, currentPage: 10, totalPages: 10, note: '', createdAt: 1 });
    }
    await page.getByRole('combobox', { name: 'Rating', exact: true }).selectOption('2');
    await failNextWrite(page, 'put'); await page.getByRole('button', { name: 'Save rating' }).click();
    await expect(page.getByRole('alert')).toContainText('Could not save');
    await expect(page.getByRole('combobox', { name: 'Rating', exact: true })).toHaveValue('2');
    expect((await records(page))[0].rating).toBe(5);
    await save(page, 'Save rating'); await page.reload();
    await expect(page.getByRole('combobox', { name: 'Rating', exact: true })).toHaveValue('2');
    await save(page, 'Clear rating'); expect((await records(page))[0].rating).toBeNull();
    const text = '  My thoughts\n<script>window.testInjected=true</script>\n';
    await page.getByLabel('Personal note').fill(text);
    await failNextWrite(page, 'put'); await page.getByRole('button', { name: 'Save note' }).click();
    await expect(page.getByRole('alert')).toContainText('Could not save');
    await expect(page.getByLabel('Personal note')).toHaveValue(text);
    expect((await records(page))[0].note).toBe('');
    await save(page, 'Save note'); await page.reload();
    await expect(page.getByLabel('Personal note')).toHaveValue(text);
    expect(await page.evaluate(() => 'testInjected' in window)).toBe(false);
    await page.getByLabel('Personal note').fill('Edited note'); await save(page, 'Save note');
    await save(page, 'Clear note'); await page.reload();
    await expect(page.getByLabel('Personal note')).toHaveValue('');
    await expect(page.getByText('No note saved yet.')).toBeVisible();
    expect((await records(page))[0]).toMatchObject({ status, totalPages: 10, currentPage: 10, rating: null, note: '', createdAt: 1 });
    // A later discovery query must contain only public search metadata.
    let requestURL = '';
    await mockSearch(page);
    page.on('request', request => { if (request.url().startsWith('https://openlibrary.org/search.json')) requestURL = request.url(); });
    await page.goto('/discover'); await page.getByRole('searchbox').fill('Dune'); await page.getByRole('searchbox').press('Enter');
    await expect(page.getByRole('button', { name: 'Preview Dune' })).toBeVisible();
    expect([...new URL(requestURL).searchParams.keys()]).toEqual(['title', 'fields', 'limit']);
    expect(requestURL).not.toContain('Edited'); expect(requestURL).not.toContain('My%20thoughts');
  });
}

test('unknown totals gate progress, permit manual finish, and can be corrected without fabricated completion', async ({ page }) => {
  await seed(page, [fixture({ authors: [], totalPages: null })]); await page.goto('/books/one');
  await expect(page.getByText('Unknown author')).toBeVisible();
  await expect(page.getByText('Total pages unknown')).toBeVisible();
  await expect(page.getByRole('progressbar')).toHaveCount(0);
  for (const status of ['finished', 'currentlyReading']) {
    await page.getByRole('combobox', { name: 'Status', exact: true }).selectOption(status); await save(page, 'Save status');
    await expect(page.getByRole('button', { name: 'Save progress' })).toHaveCount(0);
    expect((await records(page))[0]).toMatchObject({ status, totalPages: null, currentPage: 0 });
  }
  await page.getByLabel('Total pages', { exact: true }).fill('100'); await save(page, 'Save page count');
  await expect(page.getByRole('button', { name: 'Save progress' })).toBeVisible();
  await page.getByRole('combobox', { name: 'Status', exact: true }).selectOption('finished'); await save(page, 'Save status');
  await expect(page.getByText('0% completed', { exact: true })).toBeVisible();
  await page.reload(); expect((await records(page))[0]).toMatchObject({ status: 'finished', totalPages: 100, currentPage: 0 });
});

test('dashboard statistics react to additions, statuses, rating changes/clears and deletion across app tabs', async ({ page, context }) => {
  await seed(page, [fixture({ rating: 5 }), fixture({ id: 'two', sourceWorkId: 'OL2W', rating: 4, status: 'finished' }),
    fixture({ id: 'three', sourceWorkId: 'OL3W', status: 'currentlyReading', rating: 4 })]);
  await stats(page, 3, 1, 1, '4.3 of 5 stars');
  const editor = await context.newPage(); await editor.goto('/books/one');
  await editor.getByRole('combobox', { name: 'Status', exact: true }).selectOption('finished'); await save(editor, 'Save status');
  await expect(page.getByText('Finished', { exact: true }).locator('..').locator('dd')).toHaveText('2');
  await save(editor, 'Clear rating');
  await expect(page.getByText('4.0 of 5 stars')).toBeVisible();
  await editor.getByRole('button', { name: 'Remove Dune', exact: true }).click();
  await editor.getByRole('button', { name: 'Confirm removal' }).click();
  await expect(page.getByText('Total books', { exact: true }).locator('..').locator('dd')).toHaveText('2');
  await expect(page.getByText('Finished', { exact: true }).locator('..').locator('dd')).toHaveText('1');
  await editor.close();
});
