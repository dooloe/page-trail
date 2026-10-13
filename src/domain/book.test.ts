import { expect, test } from 'vitest';
import { createBook, type DiscoveryBook } from './book';

const metadata: DiscoveryBook = { source: 'openLibrary', sourceWorkId: 'OL1W', title: 'A book', authors: ['An author'], coverUrl: null, totalPages: null };

test('creation preserves metadata, supplies defaults and independent identities and authors', () => {
  const input = { ...metadata, coverUrl: 'https://example.com/cover', totalPages: 100 };
  const book = createBook(input);
  expect(book).toMatchObject({ ...input, status: 'wantToRead', currentPage: 0, rating: null, note: '' });
  expect(book.createdAt).toBe(book.updatedAt);
  expect(createBook(input).id).not.toBe(book.id);
  book.authors.push('Another author');
  expect(input.authors).toEqual(['An author']);
});

test('missing metadata uses null and allows no authors', () => {
  expect(createBook({ ...metadata, authors: [] })).toMatchObject({ authors: [], coverUrl: null, totalPages: null, rating: null });
});
