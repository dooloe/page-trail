import 'fake-indexeddb/auto';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import type { Book, DiscoveryBook } from '../domain/book';
import { LibraryDatabase } from './database';
import { LibraryRepository, type RepositoryResult } from './libraryRepository';

const metadata: DiscoveryBook = { source: 'openLibrary', sourceWorkId: 'OL1W', title: 'A book', authors: ['An author'], coverUrl: null, totalPages: 100 };
let db: LibraryDatabase;
let repository: LibraryRepository;
const value = <T>(result: RepositoryResult<T>): T => {
  if (!result.ok) throw new Error(result.error);
  return result.value;
};
const add = async (): Promise<Book> => value(await repository.add(metadata));

beforeEach(() => {
  db = new LibraryDatabase(`test-${crypto.randomUUID()}`);
  repository = new LibraryRepository(db);
});
afterEach(async () => {
  vi.restoreAllMocks();
  await db.delete();
});

test('add/get/list persist metadata and defaults; reopen retains data; delete removes everything', async () => {
  const saved = await add();
  expect(saved).toMatchObject({ ...metadata, currentPage: 0, status: 'wantToRead', rating: null, note: '' });
  expect(value(await repository.get(saved.id))).toEqual(saved);
  expect(value(await repository.list())).toEqual([saved]);
  db.close();
  await db.open();
  expect(value(await repository.get(saved.id))).toEqual(saved);
  expect(await repository.delete(saved.id)).toEqual({ ok: true, value: undefined });
  expect(await repository.get(saved.id)).toEqual({ ok: false, error: 'missing' });
  expect(value(await repository.list())).toEqual([]);
  expect((await repository.delete('missing')).ok).toBe(true);
});

test('duplicate and concurrent adds preserve one original work snapshot', async () => {
  const results = await Promise.all([repository.add(metadata), repository.add({ ...metadata, title: 'another edition' })]);
  expect(results.filter(result => result.ok)).toHaveLength(1);
  expect(results.filter(result => !result.ok && result.error === 'duplicate')).toHaveLength(1);
  const original = value(await repository.list())[0];
  expect(await repository.add({ ...metadata, title: 'replacement' })).toEqual({ ok: false, error: 'duplicate', book: original });
  expect(value(await repository.list())).toEqual([original]);
});

test('updates persist personal changes and timestamps while preserving metadata and createdAt', async () => {
  const saved = await add();
  vi.spyOn(Date, 'now').mockReturnValue(saved.updatedAt + 1000);
  const updated = value(await repository.update(saved.id, { totalPages: 90, currentPage: 30, rating: 5, note: '  personal\n' }));
  expect(updated).toEqual({ ...saved, totalPages: 90, currentPage: 30, rating: 5, note: '  personal\n', updatedAt: saved.updatedAt + 1000 });
  expect(value(await repository.get(saved.id))).toEqual(updated);
  await repository.update(saved.id, { status: 'currentlyReading' });
  expect(value(await repository.update(saved.id, { currentPage: 90 })).status).toBe('finished');
});

test('validation and missing updates leave storage and timestamps unchanged', async () => {
  const saved = await add();
  vi.spyOn(Date, 'now').mockReturnValue(saved.updatedAt + 1000);
  for (const changes of [{ currentPage: 1 }, { totalPages: 0 }, { rating: 6 }, { status: 'finished' as const, currentPage: 100 }]) {
    expect(await repository.update(saved.id, changes)).toMatchObject({ ok: false, error: 'validation' });
    expect(value(await repository.get(saved.id))).toEqual(saved);
  }
  expect(await repository.update('absent', { note: 'new' })).toEqual({ ok: false, error: 'missing' });
  expect(value(await repository.list())).toEqual([saved]);
});

test('concurrent updates to separate fields preserve both changes across database connections', async () => {
  const saved = await add();
  const otherDb = new LibraryDatabase(db.name);
  try {
    const otherRepository = new LibraryRepository(otherDb);
    const results = await Promise.all([repository.update(saved.id, { rating: 4 }), otherRepository.update(saved.id, { note: 'keep both' })]);
    expect(results.every(result => result.ok)).toBe(true);
    expect(value(await repository.get(saved.id))).toMatchObject({ rating: 4, note: 'keep both' });
  } finally {
    otherDb.close();
  }
});

test('failed persistence returns storage failure and rolls back the update', async () => {
  const saved = await add();
  const cause = new Error('write failed');
  const spy = vi.spyOn(db.books, 'put').mockRejectedValueOnce(cause);
  expect(await repository.update(saved.id, { note: 'unsaved' })).toEqual({ ok: false, error: 'storage', cause });
  spy.mockRestore();
  expect(value(await repository.get(saved.id))).toEqual(saved);
});

test('unexpected add/read/list/delete failures are never successful or duplicates', async () => {
  const cause = new Error('storage unavailable');
  vi.spyOn(db.books, 'add').mockRejectedValueOnce(cause);
  expect(await repository.add(metadata)).toEqual({ ok: false, error: 'storage', cause });
  vi.spyOn(db.books, 'get').mockRejectedValueOnce(cause);
  expect(await repository.get('id')).toEqual({ ok: false, error: 'storage', cause });
  vi.spyOn(db.books, 'toArray').mockRejectedValueOnce(cause);
  expect(await repository.list()).toEqual({ ok: false, error: 'storage', cause });
  vi.spyOn(db.books, 'delete').mockRejectedValueOnce(cause);
  expect(await repository.delete('id')).toEqual({ ok: false, error: 'storage', cause });
});
