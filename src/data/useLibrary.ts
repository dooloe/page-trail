import { useLiveQuery } from 'dexie-react-hooks';
import type { Book } from '../domain/book';
import type { LibraryRepository } from './libraryRepository';
import type { ReadState } from './readState';

export function useBooks(repository: LibraryRepository): ReadState<Book[]> {
  const result = useLiveQuery(async () => {
    const result = await repository.list();
    const state: ReadState<Book[]> = result.ok ? { kind: 'success', value: result.value }
      : { kind: 'error', message: 'Could not load your library. Please reload to try again.' };
    return { repository, state };
  }, [repository]);
  return result?.repository === repository ? result.state : { kind: 'loading' };
}

export function useBook(repository: LibraryRepository, id: string): ReadState<Book | null> {
  const result = useLiveQuery(async () => {
    const record = await repository.get(id);
    const state: ReadState<Book | null> = record.ok ? { kind: 'success', value: record.value }
      : record.error === 'missing' ? { kind: 'success', value: null }
        : { kind: 'error', message: 'Could not load this book. Please reload to try again.' };
    return { id, repository, state };
  }, [repository, id]);
  // Some hook versions retain the previous result until the new query resolves.
  return result?.id === id && result.repository === repository ? result.state : { kind: 'loading' };
}
