import { expect, test } from 'vitest';
import { normalizeBook, normalizeWorkId } from './normalizeBook';

test('canonical identity accepts work paths and bare IDs, rejecting editions and unusable keys', () => {
  expect(normalizeWorkId('/works/OL123W')).toBe('OL123W');
  expect(normalizeWorkId(' OL123W ')).toBe('OL123W');
  for (const key of ['/books/OL123M', 'OL123M', '/works/', 'OL0W', null, 123, 'prefixOL123W']) {
    expect(normalizeWorkId(key)).toBeNull();
  }
});

test('complete metadata normalizes without mutation or saved personal fields', () => {
  const input = Object.freeze({ key: '/works/OL123W', title: ' A book ',
    author_name: Object.freeze([' Author ', '', null, 42, 'Other']), cover_i: 123,
    number_of_pages_median: 400, note: 'private', rating: 5 });
  expect(normalizeBook(input)).toEqual({ source: 'openLibrary', sourceWorkId: 'OL123W',
    title: 'A book', authors: ['Author', 'Other'],
    coverUrl: 'https://covers.openlibrary.org/b/id/123-M.jpg?default=false', totalPages: 400 });
  expect(input.author_name).toEqual([' Author ', '', null, 42, 'Other']);
});

test('missing metadata supplies safe defaults and rejects missing identity/title', () => {
  expect(normalizeBook({ key: 'OL1W', title: 'Book' })).toEqual({ source: 'openLibrary',
    sourceWorkId: 'OL1W', title: 'Book', authors: [], coverUrl: null, totalPages: null });
  for (const input of [null, [], 'book', {}, { key: 'OL1W', title: ' ' },
    { key: 'OL1M', title: 'Book' }, { key: 'OL1W', title: 123 }]) expect(normalizeBook(input)).toBeNull();
});

test.each([undefined, null, 0, -1, 1.5, Infinity, NaN, '123', {}, Number.MAX_SAFE_INTEGER + 1])(
  'invalid optional metadata %s never becomes covers or pages', value => {
    expect(normalizeBook({ key: 'OL1W', title: 'Book', author_name: value,
      cover_i: value, number_of_pages_median: value })).toMatchObject({ authors: [], coverUrl: null, totalPages: null });
  });
