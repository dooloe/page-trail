import Dexie, { type Table } from 'dexie';
import type { Book } from '../domain/book';

export class LibraryDatabase extends Dexie {
  books!: Table<Book, string>;

  constructor(name = 'page-trail') {
    super(name);
    this.version(1).stores({ books: 'id, &[source+sourceWorkId], status' });
  }
}
