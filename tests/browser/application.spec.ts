import { expect, test } from '@playwright/test';

test('production application renders dashboard, routes and persisted reading workflows', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('https://openlibrary.org/search.json?*', route => route.fulfill({
    json: { docs: [{ key: '/works/OL1W', title: 'Dune', author_name: ['Frank Herbert'], number_of_pages_median: 400 }] },
  }));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Your reading journey' })).toBeVisible();
  await expect(page.getByText('Total books', { exact: true })).toBeVisible();
  await expect(page.getByText('No ratings yet', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'My Library', exact: true }).click();
  await expect(page.getByText('Your bookshelf is empty.', { exact: false })).toBeVisible();
  await page.getByRole('link', { name: 'Discover Books', exact: true }).click();
  await page.getByLabel('Title or author').fill('Dune');
  await page.getByRole('button', { name: 'Search books', exact: true }).click();
  await page.getByRole('button', { name: 'Preview Dune' }).click();
  await page.getByRole('button', { name: 'Add to Library', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Already in Library' })).toBeDisabled();
  await page.getByRole('link', { name: 'My Library', exact: true }).click();
  await page.getByRole('link', { name: 'Dune', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Dune', exact: true })).toBeVisible();
  await page.getByRole('combobox', { name: 'Status', exact: true }).selectOption('currentlyReading');
  await page.getByRole('button', { name: 'Save status', exact: true }).click();
  await expect(page.getByLabel('Current page', { exact: true })).toBeVisible();
  await page.getByLabel('Current page', { exact: true }).fill('120');
  await page.getByRole('button', { name: 'Save progress', exact: true }).click();
  await expect(page.getByText('30% completed', { exact: true })).toBeVisible();
  await page.getByRole('combobox', { name: 'Rating', exact: true }).selectOption('4');
  await page.getByRole('button', { name: 'Save rating', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Save rating', exact: true })).toBeEnabled();
  await page.getByLabel('Personal note').fill('A memorable read.');
  await page.getByRole('button', { name: 'Save note', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Save note', exact: true })).toBeEnabled();
  await page.reload();
  await expect(page.getByLabel('Personal note')).toHaveValue('A memorable read.');
  await expect(page.getByRole('combobox', { name: 'Rating', exact: true })).toHaveValue('4');
  await expect(page.getByText('30% completed', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Dashboard', exact: true }).click();
  await expect(page.getByText('4.0 of 5 stars', { exact: true })).toBeVisible();
  await page.screenshot({ path: 'test-results/application-dashboard.png', fullPage: true });
  expect(errors).toEqual([]);
});
