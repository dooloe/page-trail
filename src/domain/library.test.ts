import { expect, test } from 'vitest';
import { createBook, type Book } from './book';
import { readingProgress, readingStatistics, selectBooks } from './library';

const book = (overrides: Partial<Book>): Book => ({ ...createBook({ source: 'openLibrary', sourceWorkId: 'OL1W', title: 'Book', authors: ['Author'], coverUrl: null, totalPages: 400 }), ...overrides });

test('library search combines title/author matching and status filtering without mutation', () => {
  const books = [book({ title: 'Dune', authors: ['Frank Herbert'] }), book({ title: 'Herbert biography', status: 'finished' })];
  const snapshot = structuredClone(books);
  expect(selectBooks(books, ' HERBERT ')).toEqual(books);
  expect(selectBooks(books, 'herbert', 'finished')).toEqual([books[1]]);
  expect(selectBooks(books, 'missing')).toEqual([]);
  expect(selectBooks(books, '', 'currentlyReading')).toEqual([]);
  expect(books).toEqual(snapshot);
});

test('title and rating ordering use stable title and ID ties and put unrated last', () => {
  const books = [book({ id: 'z', title: 'Alpha', rating: 3 }), book({ id: 'a', title: 'Alpha', rating: 3 }),
    book({ id: 'b', title: 'Beta', rating: null }), book({ id: 'c', title: 'Gamma', rating: 5 })];
  expect(selectBooks(books).map(book => book.id)).toEqual(['a', 'z', 'b', 'c']);
  expect(selectBooks(books, '', 'all', 'rating').map(book => book.id)).toEqual(['c', 'a', 'z', 'b']);
});

test('statistics count authoritative statuses and exclude unrated books', () => {
  expect(readingStatistics([])).toEqual({ total: 0, finished: 0, currentlyReading: 0, averageRating: null });
  const books = [book({ status: 'finished', currentPage: 0, rating: 5 }),
    book({ status: 'currentlyReading', currentPage: 400, rating: 4 }), book({ rating: null })];
  expect(readingStatistics(books)).toEqual({ total: 3, finished: 1, currentlyReading: 1, averageRating: 4.5 });
  expect(readingStatistics(books.map(book => ({ ...book, rating: null }))).averageRating).toBeNull();
  expect(readingStatistics(books.slice(1))).toEqual({ total: 2, finished: 0, currentlyReading: 1, averageRating: 4 });
});

test('progress handles zero, intermediate, final and unknown totals without premature rounding', () => {
  expect(readingProgress({ currentPage: 0, totalPages: 400 })).toBe(0);
  expect(readingProgress({ currentPage: 120, totalPages: 400 })).toBe(30);
  expect(readingProgress({ currentPage: 400, totalPages: 400 })).toBe(100);
  expect(readingProgress({ currentPage: 1, totalPages: 3 })).toBeCloseTo(100 / 3);
  expect(readingProgress({ currentPage: 0, totalPages: null })).toBeNull();
});

test.each(['wantToRead', 'currentlyReading', 'finished'] as const)('positive %s filters combine with author matching', status => {
  const match = book({ status, authors: ['First', 'Second author'] });
  expect(selectBooks([match, book({ status: status === 'finished' ? 'wantToRead' : 'finished' })], 'SECOND', status)).toEqual([match]);
});
