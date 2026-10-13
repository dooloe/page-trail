import { expect, test } from 'vitest';
import { createBook, readingStatuses, type Book } from './book';
import { applyBookChanges, type BookChanges } from './updateBook';
const metadata = { source: 'openLibrary' as const, sourceWorkId: 'OL1W', title: 'A book', authors: ['An author'], coverUrl: null, totalPages: null };

const book = (overrides: Partial<Book> = {}): Book => ({ ...createBook(metadata), totalPages: 100, status: 'currentlyReading', currentPage: 20, ...overrides });
const apply = (saved: Book, changes: BookChanges) => {
  const result = applyBookChanges(saved, changes);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.message);
  return result.book;
};

test.each(readingStatuses)('manual status %s preserves all other fields at completion', status => {
  const saved = book({ currentPage: 100, rating: 5, note: 'keep' });
  expect(apply(saved, { status })).toEqual({ ...saved, status });
});

test('manual completion permits unknown total; rating and note do not auto-complete', () => {
  expect(apply(book({ totalPages: null }), { status: 'finished' }).status).toBe('finished');
  expect(apply(book({ currentPage: 100 }), { rating: 1, note: '  <b>text</b>\n' })).toMatchObject({ status: 'currentlyReading', rating: 1, note: '  <b>text</b>\n' });
  expect(apply(book({ rating: 5, note: 'old' }), { rating: null, note: '' })).toMatchObject({ rating: null, note: '' });
  expect(apply(book(), { rating: 5 }).rating).toBe(5);
});

test('progress permits zero and automatically completes at the total', () => {
  expect(apply(book(), { currentPage: 0 }).currentPage).toBe(0);
  expect(apply(book(), { currentPage: 100 }).status).toBe('finished');
  expect(apply(book(), { totalPages: 20 }).status).toBe('finished');
});

test.each(readingStatuses)('joint page corrections validate final values for %s', status => {
  expect(apply(book({ status }), { totalPages: 10, currentPage: 10 })).toMatchObject({ totalPages: 10, currentPage: 10, status: status === 'currentlyReading' ? 'finished' : status });
  expect(apply(book({ status }), { totalPages: null, currentPage: 0 })).toMatchObject({ totalPages: null, currentPage: 0, status });
});

test.each([-1, 1.5, NaN, Infinity, -Infinity, undefined])('rejects invalid current page %s', currentPage => {
  expect(applyBookChanges(book(), { currentPage }).ok).toBe(false);
});
test.each([0, -1, 1.5, NaN, Infinity, -Infinity, undefined])('rejects invalid total %s', totalPages => {
  expect(applyBookChanges(book(), { totalPages }).ok).toBe(false);
});
test.each([0, 6, -1, 1.5, NaN, Infinity, undefined])('rejects invalid rating %s', rating => {
  expect(applyBookChanges(book(), { rating }).ok).toBe(false);
});

test('rejects bad combinations, statuses, notes and protected fields', () => {
  const cases: [Book, unknown][] = [
    [book(), { totalPages: 10 }], [book(), { currentPage: 101 }],
    [book({ totalPages: null }), { currentPage: 0 }],
    ...(['wantToRead', 'finished'] as const).map(status => [book({ status }), { currentPage: 1 }] as [Book, unknown]),
    [book(), { status: 'finished', currentPage: 100 }],
    [book(), { status: 'finished', totalPages: 100 }],
    [book(), { status: 'invalid' }], [book(), { status: undefined }],
    [book(), { note: null }], [book(), { updatedAt: 1 }], [book(), { title: 'changed' }],
  ];
  for (const [saved, change] of cases) expect(applyBookChanges(saved, change as BookChanges).ok).toBe(false);
});

test('valid and rejected changes never mutate inputs or change metadata/timestamps', () => {
  const saved = book();
  const snapshot = structuredClone(saved);
  const changes = Object.freeze({ currentPage: 30, note: 'new' });
  const next = apply(saved, changes);
  expect(next).toEqual({ ...snapshot, ...changes });
  next.authors.push('other');
  applyBookChanges(saved, { currentPage: -1 });
  expect(saved).toEqual(snapshot);
});
