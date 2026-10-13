import { expect, test } from '@playwright/test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { discover, failNextWrite, fixture, holdWrites, keyboardActivate, mockSearch, records, releaseWrites, save, searchPattern, seed, stats } from './helpers';

test('same test-owned browser profile retains every personal field after genuine close and relaunch', async ({ browserName, playwright }) => {
  const browserType = playwright[browserName];
  const directory = await mkdtemp(join(tmpdir(), 'page-trail-profile-'));
  const origin = 'http://127.0.0.1:4173';
  let context = await browserType.launchPersistentContext(directory, { baseURL: origin });
  try {
    let page = await context.newPage();
    await mockSearch(page); await page.goto('/discover');
    await page.getByRole('searchbox').fill('Dune'); await page.getByRole('searchbox').press('Enter');
    await page.getByRole('button', { name: 'Preview Dune' }).click();
    await page.getByRole('button', { name: 'Add to Library', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Already in Library' })).toBeDisabled();
    await page.goto(`/books/${(await records(page))[0].id}`);
    await page.getByRole('combobox', { name: 'Status', exact: true }).selectOption('currentlyReading'); await save(page, 'Save status');
    await page.getByLabel('Current page', { exact: true }).fill('120'); await save(page, 'Save progress');
    await page.getByRole('combobox', { name: 'Rating', exact: true }).selectOption('5'); await save(page, 'Save rating');
    await page.getByLabel('Personal note').fill('Reopen this exact profile.'); await save(page, 'Save note');
    const saved = await records(page);
    await context.close();
    context = await browserType.launchPersistentContext(directory, { baseURL: origin });
    page = await context.newPage(); await page.goto(`/books/${saved[0].id}`);
    await expect(page.getByRole('heading', { name: 'Dune', exact: true })).toBeVisible();
    expect(await records(page)).toEqual(saved);
    await expect(page.getByLabel('Personal note')).toHaveValue(saved[0].note);
    await expect(page.getByText('30% completed', { exact: true })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Rating', exact: true })).toHaveValue('5');
  } finally {
    await context.close(); await rm(directory, { recursive: true, force: true });
  }
});

for (const error of ['http', 'network', 'timeout'] as const) {
  test(`${error} discovery failure allows saved reads/edits and retry`, async ({ page }) => {
    await seed(page, [fixture({ status: 'currentlyReading' })]);
    if (error === 'timeout') await page.clock.install();
    await page.route(searchPattern, async route => {
      if (error === 'http') await route.fulfill({ status: 503 });
      else if (error === 'network') await route.abort();
      // For timeout, leave this request pending; the application's own timer must abort it.
    });
    await page.goto('/discover'); await page.getByRole('searchbox').fill('Dune');
    const request = page.waitForRequest(searchPattern);
    await page.getByRole('searchbox').press('Enter'); await request;
    if (error === 'timeout') {
      await expect(page.getByRole('status')).toHaveText('Searching Open Library…');
      await page.clock.fastForward(10_001);
    }
    await expect(page.getByRole('alert')).toContainText(error === 'timeout' ? 'too long' : error === 'network' ? 'Unable to connect' : 'could not complete');
    await expect(page.getByRole('button', { name: 'Retry search' })).toBeVisible();
    await page.goto('/books/one');
    await page.getByLabel('Personal note').fill(`Saved despite ${error}.`); await save(page, 'Save note');
    await page.getByLabel('Current page', { exact: true }).fill('40'); await save(page, 'Save progress');
    await page.reload();
    await expect(page.getByLabel('Personal note')).toHaveValue(`Saved despite ${error}.`);
    expect((await records(page))[0].currentPage).toBe(40);
    await page.goto('/discover');
    await page.getByRole('searchbox').fill('Dune'); await page.getByRole('searchbox').press('Enter');
    if (error === 'timeout') await page.clock.fastForward(10_001);
    await expect(page.getByRole('alert')).toBeVisible();
    await page.unroute(searchPattern); await mockSearch(page);
    await page.getByRole('button', { name: 'Retry search' }).click();
    await expect(page.getByRole('button', { name: 'Preview Dune' })).toBeVisible();
  });
}

for (const entry of ['library', 'details'] as const) {
  test(`${entry} removal manages modal focus, cancel/Escape, failed retry and full deletion`, async ({ page }) => {
    const original = fixture({ status: 'currentlyReading', currentPage: 120, rating: 5, note: 'Do not lose this on cancel.' });
    await seed(page, [original]); await page.goto(entry === 'library' ? '/library' : '/books/one');
    const trigger = page.getByRole('button', { name: 'Remove Dune', exact: true });
    await keyboardActivate(page, trigger);
    const dialog = page.getByRole('dialog', { name: 'Remove Dune?' });
    const keep = page.getByRole('button', { name: 'Keep book' });
    await expect(keep).toBeFocused();
    for (let n = 0; n < 4; n++) {
      await page.keyboard.press('Tab');
      expect(await page.evaluate(() => document.querySelector('dialog')?.contains(document.activeElement))).toBe(true);
    }
    await page.keyboard.press('Escape'); await expect(dialog).toHaveCount(0); await expect(trigger).toBeFocused();
    expect(await records(page)).toEqual([original]);
    await keyboardActivate(page, trigger); await keyboardActivate(page, keep);
    expect(await records(page)).toEqual([original]); await expect(trigger).toBeFocused();
    await keyboardActivate(page, trigger); await failNextWrite(page, 'delete');
    await keyboardActivate(page, page.getByRole('button', { name: 'Confirm removal' }));
    await expect(page.getByRole('alert')).toContainText('Could not remove');
    expect(await records(page)).toEqual([original]); await expect(dialog).toBeVisible();
    await keyboardActivate(page, page.getByRole('button', { name: 'Confirm removal' }));
    await expect(page.getByText('Your bookshelf is empty.', { exact: false })).toBeVisible();
    await expect(page).toHaveURL(/\/library$/);
    if (entry === 'library') await expect(page.getByRole('heading', { name: 'My Library' })).toBeFocused();
    else await expect(page.getByRole('main')).toBeFocused();
    expect(await records(page)).toEqual([]);
    await page.goto('/books/one'); await expect(page.getByRole('heading', { name: 'Book not found' })).toBeVisible();
    await stats(page, 0, 0, 0, 'No ratings yet');
  });
}

test('database read failures appear as errors rather than empty data and recover on reload', async ({ page }) => {
  await seed(page, [fixture()]);
  await page.addInitScript(() => {
    for (const method of ['getAll', 'get'] as const) {
      const original = IDBObjectStore.prototype[method];
      Object.defineProperty(IDBObjectStore.prototype, method, { configurable: true, value: function (this: IDBObjectStore, ...args: unknown[]) {
        if (this.name === 'books' && sessionStorage.getItem('test-read-failure') === 'yes') throw new DOMException('Test read failure', 'UnknownError');
        return Reflect.apply(original, this, args);
      } });
    }
  });
  await page.evaluate(() => sessionStorage.setItem('test-read-failure', 'yes'));
  for (const route of ['/', '/library', '/books/one']) {
    await page.goto(route); await expect(page.getByRole('alert')).toContainText('Could not load');
    await expect(page.getByText('Your bookshelf is empty.', { exact: false })).toHaveCount(0);
    await expect(page.getByText('No ratings yet', { exact: true })).toHaveCount(0);
  }
  await page.evaluate(() => sessionStorage.removeItem('test-read-failure')); await page.reload();
  await expect(page.getByRole('heading', { name: 'Dune', exact: true })).toBeVisible();
  expect(await records(page)).toHaveLength(1);
});

test('pending add/update/delete prevent repeats until persistence acknowledges completion', async ({ page }) => {
  await mockSearch(page); await discover(page);
  await holdWrites(page);
  await page.getByRole('button', { name: 'Add to Library', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Adding to Library…' })).toBeDisabled();
  await expect(page.getByText('Added to your library.', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Adding to Library…' }).evaluate((element: HTMLButtonElement) => element.click());
  await releaseWrites(page);
  await expect(page.getByRole('button', { name: 'Already in Library' })).toBeDisabled();
  expect(await records(page)).toHaveLength(1);
  await page.goto(`/books/${(await records(page))[0].id}`);
  await page.getByRole('combobox', { name: 'Status', exact: true }).selectOption('currentlyReading');
  await holdWrites(page);
  await page.getByRole('button', { name: 'Save status' }).click();
  await expect(page.getByText('Saving changes…')).toBeVisible();
  await expect(page.getByLabel('Personal note')).toBeDisabled();
  await expect(page.getByText('Changes saved.', { exact: true })).toHaveCount(0);
  await releaseWrites(page); await expect(page.getByText('Changes saved.', { exact: true })).toBeVisible();
  expect((await records(page))[0].status).toBe('currentlyReading');
  await page.getByRole('button', { name: 'Remove Dune', exact: true }).click();
  await holdWrites(page); await page.getByRole('button', { name: 'Confirm removal' }).click();
  await expect(page.getByRole('button', { name: 'Keep book' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Confirm removal' })).toBeDisabled();
  await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).toBeVisible();
  await releaseWrites(page);
  await expect(page.getByText('Your bookshelf is empty.', { exact: false })).toBeVisible();
  expect(await records(page)).toEqual([]);
});
