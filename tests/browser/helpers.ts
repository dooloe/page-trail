import { expect, type Locator, type Page } from '@playwright/test';
import type { Book, DiscoveryBook } from '../../src/domain/book';

export const searchPattern = 'https://openlibrary.org/search.json?*';
export const dune = { key: '/works/OL1W', title: 'Dune', author_name: ['Frank Herbert'], number_of_pages_median: 400 };

export function fixture(overrides: Partial<Book> = {}): Book {
  return { id: 'one', source: 'openLibrary', sourceWorkId: 'OL1W', title: 'Dune',
    authors: ['Frank Herbert'], coverUrl: null, totalPages: 400, currentPage: 0,
    status: 'wantToRead', rating: null, note: '', createdAt: 1, updatedAt: 1, ...overrides };
}

export async function seed(page: Page, books: Book[]) {
  await page.goto('/');
  await expect(page.getByText('No ratings yet', { exact: true })).toBeVisible();
  await page.evaluate(async data => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('page-trail');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('books', 'readwrite');
        const store = tx.objectStore('books');
        store.clear(); data.forEach(book => store.put(book));
        tx.oncomplete = () => resolve(); tx.onabort = () => reject(tx.error);
      });
    } finally { db.close(); }
  }, books);
  await page.reload();
}

export async function records(page: Page): Promise<Book[]> {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('page-trail');
      request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
    });
    try {
      return await new Promise<Book[]>((resolve, reject) => {
        const request = db.transaction('books').objectStore('books').getAll();
        request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
      });
    } finally { db.close(); }
  });
}

export async function mockSearch(page: Page, docs: unknown[] = [dune]) {
  await page.route(searchPattern, route => route.fulfill({ json: { docs } }));
}

export async function discover(page: Page, mode: 'title' | 'author' = 'title', query = 'Dune') {
  await page.goto('/discover');
  await page.getByRole('combobox', { name: 'Search by', exact: true }).selectOption(mode);
  await page.getByRole('searchbox', { name: 'Title or author' }).fill(query);
  await page.getByRole('searchbox').press('Enter');
  await page.getByRole('button', { name: 'Preview Dune' }).click();
}

export async function save(page: Page, button: string) {
  await page.getByRole('button', { name: button, exact: true }).click();
  await expect(page.getByText('Changes saved.', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save status', exact: true })).toBeEnabled();
}

export async function stats(page: Page, total: number, finished: number, reading: number, average: string) {
  await page.goto('/');
  for (const [label, value] of [['Total books', String(total)], ['Finished', String(finished)],
    ['Currently reading', String(reading)], ['Average rating', average]]) {
    await expect(page.locator('dl div').filter({ has: page.getByText(label, { exact: true }) }).locator('dd')).toHaveText(value);
  }
}

/** Native IndexedDB fault injection stays wholly inside this test browser. */
export async function failNextWrite(page: Page, method: 'add' | 'put' | 'delete') {
  await page.evaluate(method => {
    const prototype = IDBObjectStore.prototype;
    const original = prototype[method];
    Object.defineProperty(prototype, method, { configurable: true, writable: true,
      value: function (this: IDBObjectStore, ...args: unknown[]) {
        if (this.name !== 'books') return Reflect.apply(original, this, args);
        Object.defineProperty(prototype, method, { configurable: true, writable: true, value: original });
        throw new DOMException('Controlled test write failure', 'QuotaExceededError');
      } });
  }, method);
}

export async function keyboardActivate(page: Page, locator: Locator) {
  await locator.focus();
  await page.keyboard.press('Enter');
}

/** Delay delivery of IndexedDB's write-completion acknowledgment in this test page. */
export async function holdWrites(page: Page) {
  await page.evaluate(() => {
    const prototype = IDBTransaction.prototype;
    const descriptor = Object.getOwnPropertyDescriptor(prototype, 'oncomplete')!;
    const completions: (() => void)[] = [];
    let held = true;
    Object.defineProperty(prototype, 'oncomplete', { ...descriptor,
      set(this: IDBTransaction, handler: ((event: Event) => void) | null) {
        const transaction = this;
        descriptor.set!.call(this, handler === null ? null : function (event: Event) {
          const deliver = () => handler.call(transaction, event);
          if (held && transaction.mode === 'readwrite' && transaction.objectStoreNames.contains('books')) {
            completions.push(deliver);
          } else deliver();
        });
      },
    });
    (window as unknown as { releaseTestWrite: () => void }).releaseTestWrite = () => {
      held = false;
      Object.defineProperty(prototype, 'oncomplete', descriptor);
      completions.splice(0).forEach(deliver => deliver());
    };
  });
}

export async function releaseWrites(page: Page) {
  await page.evaluate(() => (window as unknown as { releaseTestWrite: () => void }).releaseTestWrite());
}

export async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

export function metadata(book: Book): DiscoveryBook {
  const { source, sourceWorkId, title, authors, coverUrl, totalPages } = book;
  return { source, sourceWorkId, title, authors, coverUrl, totalPages };
}
