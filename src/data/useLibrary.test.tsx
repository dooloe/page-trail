import 'fake-indexeddb/auto';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { LibraryDatabase } from './database';
import { LibraryRepository } from './libraryRepository';
import { useBook, useBooks } from './useLibrary';

let db: LibraryDatabase;
let repository: LibraryRepository;
const metadata = { source: 'openLibrary' as const, sourceWorkId: 'OL1W', title: 'Dune', authors: [], coverUrl: null, totalPages: 400 };

beforeEach(() => {
  db = new LibraryDatabase(`hooks-${crypto.randomUUID()}`);
  repository = new LibraryRepository(db);
});
afterEach(async () => {
  cleanup();
  vi.restoreAllMocks();
  await db.delete();
});

test('library subscriptions distinguish loading and empty data and observe committed changes', async () => {
  const { result } = renderHook(() => useBooks(repository));
  expect(result.current).toEqual({ kind: 'loading' });
  await waitFor(() => expect(result.current).toEqual({ kind: 'success', value: [] }));
  const added = await act(() => repository.add(metadata));
  if (!added.ok) throw new Error(added.error);
  await waitFor(() => expect(result.current).toEqual({ kind: 'success', value: [added.value] }));
  await act(() => repository.update(added.value.id, { note: 'A private note', rating: 4 }));
  await waitFor(() => expect(result.current).toMatchObject({ kind: 'success', value: [{ note: 'A private note', rating: 4 }] }));
  await act(() => repository.delete(added.value.id));
  await waitFor(() => expect(result.current).toEqual({ kind: 'success', value: [] }));
});

test('single-book subscriptions isolate changed IDs and observe removal', async () => {
  const added = await repository.add(metadata);
  if (!added.ok) throw new Error(added.error);
  const { result, rerender } = renderHook(({ id }) => useBook(repository, id), { initialProps: { id: added.value.id } });
  await waitFor(() => expect(result.current).toEqual({ kind: 'success', value: added.value }));
  rerender({ id: 'absent' });
  expect(result.current).toEqual({ kind: 'loading' });
  await waitFor(() => expect(result.current).toEqual({ kind: 'success', value: null }));
  rerender({ id: added.value.id });
  await waitFor(() => expect(result.current).toEqual({ kind: 'success', value: added.value }));
  await act(() => repository.delete(added.value.id));
  await waitFor(() => expect(result.current).toEqual({ kind: 'success', value: null }));
});

test('storage errors do not masquerade as an empty library or missing book', async () => {
  vi.spyOn(repository, 'list').mockResolvedValue({ ok: false, error: 'storage', cause: new Error('unavailable') });
  vi.spyOn(repository, 'get').mockResolvedValue({ ok: false, error: 'storage', cause: new Error('unavailable') });
  const library = renderHook(() => useBooks(repository));
  const book = renderHook(() => useBook(repository, 'id'));
  await waitFor(() => expect(library.result.current.kind).toBe('error'));
  await waitFor(() => expect(book.result.current.kind).toBe('error'));
});
