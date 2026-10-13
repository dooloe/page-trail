import { expect, test } from '@playwright/test';
import { discover, dune, failNextWrite, keyboardActivate, mockSearch, records, searchPattern } from './helpers';

for (const mode of ['title', 'author'] as const) {
  test(`${mode} discovery previews metadata, saves defaults, prevents alternate-edition duplicates`, async ({ page }) => {
    const requests: URL[] = [];
    let docs: unknown[] = [dune];
    await page.route(searchPattern, route => {
      requests.push(new URL(route.request().url()));
      return route.fulfill({ json: { docs } });
    });
    await discover(page, mode, mode === 'title' ? 'Dune & café' : 'Frank Herbert');
    const preview = page.getByRole('region', { name: 'Preview of Dune' });
    await expect(preview.getByRole('heading', { name: 'Dune', exact: true })).toBeFocused();
    await expect(preview.getByRole('img', { name: 'Cover of Dune' })).toHaveAttribute('src', '/cover-fallback.svg');
    await expect(preview.getByText('400 pages')).toBeVisible();
    await keyboardActivate(page, page.getByRole('button', { name: 'Add to Library', exact: true }));
    await expect(page.getByRole('button', { name: 'Already in Library' })).toBeDisabled();
    const [book] = await records(page);
    expect(book).toMatchObject({ title: 'Dune', authors: ['Frank Herbert'], sourceWorkId: 'OL1W',
      status: 'wantToRead', currentPage: 0, rating: null, note: '', totalPages: 400, coverUrl: null });
    expect(book.createdAt).toBe(book.updatedAt);
    expect(requests[0].searchParams.get(mode)).toBe(mode === 'title' ? 'Dune & café' : 'Frank Herbert');
    docs = [{ ...dune, key: 'OL1W', title: 'Dune alternate edition' }];
    await page.getByRole('searchbox').fill('alternate'); await page.getByRole('searchbox').press('Enter');
    await page.getByRole('button', { name: 'Preview Dune alternate edition' }).click();
    await expect(page.getByRole('button', { name: 'Already in Library' })).toBeDisabled();
    expect(await records(page)).toEqual([book]);
    await page.goto('/library');
    await keyboardActivate(page, page.getByRole('link', { name: 'Dune', exact: true }));
    await expect(page).toHaveURL(new RegExp(`/books/${book.id}$`));
    await page.reload(); await expect(page.getByRole('heading', { name: 'Dune', exact: true })).toBeVisible();
    expect(requests).toHaveLength(2);
  });
}

test('blank, loading, error, retry and empty results remain distinct with keyboard submission', async ({ page }) => {
  let release!: () => Promise<void>;
  const queries: string[] = [];
  let calls = 0;
  await page.route(searchPattern, async route => {
    queries.push(new URL(route.request().url()).searchParams.get('author') ?? '');
    calls++;
    if (calls === 1) {
      await new Promise<void>(resolve => { release = async () => { await route.fulfill({ status: 503 }); resolve(); }; });
    } else await route.fulfill({ json: { docs: [] } });
  });
  await page.goto('/discover');
  await expect(page.getByText('Search for a book to start exploring.')).toBeVisible();
  await page.getByRole('searchbox').press('Enter');
  await expect(page.getByRole('alert')).toHaveText('Enter a title or author to search.');
  expect(calls).toBe(0);
  await page.getByRole('combobox', { name: 'Search by', exact: true }).selectOption('author');
  await page.getByRole('searchbox').fill('Herbert');
  const request = page.waitForRequest(searchPattern);
  await page.getByRole('searchbox').press('Enter'); await request;
  await expect(page.getByRole('status')).toHaveText('Searching Open Library…');
  await expect.poll(() => typeof release).toBe('function'); await release();
  await expect(page.getByRole('alert')).toContainText('could not complete');
  await page.getByRole('searchbox').fill('changed draft');
  await page.getByRole('combobox', { name: 'Search by', exact: true }).selectOption('title');
  await keyboardActivate(page, page.getByRole('button', { name: 'Retry search' }));
  await expect(page.getByRole('status')).toContainText('No books found');
  expect(queries).toEqual(['Herbert', 'Herbert']);
  await page.getByRole('link', { name: 'My Library', exact: true }).click();
  await expect(page.getByText('Your bookshelf is empty.', { exact: false })).toBeVisible();
});

test('failed add retains preview and succeeds on retry; close restores keyboard focus', async ({ page }) => {
  await mockSearch(page); await discover(page);
  await failNextWrite(page, 'add');
  await page.getByRole('button', { name: 'Add to Library', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('Could not add this book. Please try again.');
  expect(await records(page)).toEqual([]);
  await expect(page.getByRole('region', { name: 'Preview of Dune' })).toBeVisible();
  await page.getByRole('button', { name: 'Add to Library', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Already in Library' })).toBeDisabled();
  expect(await records(page)).toHaveLength(1);
  await keyboardActivate(page, page.getByRole('button', { name: 'Close preview' }));
  await expect(page.getByRole('button', { name: 'Preview Dune' })).toBeFocused();
});

test('missing authors/pages and broken covers use usable defaults in results and previews', async ({ page }) => {
  await page.route('https://covers.openlibrary.org/**', route => route.abort());
  await mockSearch(page, [{ key: 'OL1W', title: 'Dune', cover_i: 123 }]);
  await discover(page);
  const preview = page.getByRole('region', { name: 'Preview of Dune' });
  await expect(preview.getByText('Unknown author')).toBeVisible();
  await expect(preview.getByText('Page count unavailable')).toBeVisible();
  for (const image of await page.getByRole('img', { name: 'Cover of Dune' }).all())
    await expect(image).toHaveAttribute('src', '/cover-fallback.svg');
});
