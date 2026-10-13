import { createBook, type Book, type DiscoveryBook } from '../domain/book';
import { applyBookChanges, type BookChanges } from '../domain/updateBook';
import { LibraryDatabase } from './database';

export type RepositoryResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: 'missing' }
  | { ok: false; error: 'duplicate'; book: Book }
  | { ok: false; error: 'validation'; message: string }
  | { ok: false; error: 'storage'; cause: unknown };

/** All operations resolve explicit results, including unexpected storage failures. */
export class LibraryRepository {
  constructor(private readonly db: LibraryDatabase) {}

  private async run<T>(operation: () => Promise<RepositoryResult<T>>): Promise<RepositoryResult<T>> {
    try {
      return await operation();
    } catch (cause) {
      return { ok: false, error: 'storage', cause };
    }
  }

  add(metadata: DiscoveryBook): Promise<RepositoryResult<Book>> {
    return this.run(async () => {
      const book = createBook(metadata);
      try {
        await this.db.books.add(book);
        return { ok: true, value: book };
      } catch (cause) {
        if (!(cause instanceof Error) || cause.name !== 'ConstraintError') throw cause;
        const existing = await this.db.books.where('[source+sourceWorkId]').equals([book.source, book.sourceWorkId]).first();
        if (!existing) throw cause;
        return { ok: false, error: 'duplicate', book: existing };
      }
    });
  }

  get(id: string): Promise<RepositoryResult<Book>> {
    return this.run(async () => {
      const book = await this.db.books.get(id);
      return book ? { ok: true, value: book } : { ok: false, error: 'missing' };
    });
  }

  list(): Promise<RepositoryResult<Book[]>> {
    return this.run(async () => ({ ok: true, value: await this.db.books.toArray() }));
  }

  /** Deleting an absent ID succeeds; no record is created. */
  delete(id: string): Promise<RepositoryResult<void>> {
    return this.run(async () => {
      await this.db.books.delete(id);
      return { ok: true, value: undefined };
    });
  }

  update(id: string, changes: BookChanges): Promise<RepositoryResult<Book>> {
    return this.run(() => this.db.transaction('rw', this.db.books, async () => {
      const book = await this.db.books.get(id);
      if (!book) return { ok: false, error: 'missing' };
      const result = applyBookChanges(book, changes);
      if (!result.ok) return result;
      const saved = { ...result.book, updatedAt: Date.now() };
      await this.db.books.put(saved);
      return { ok: true, value: saved };
    }));
  }
}
