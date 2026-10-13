import type { Book, ReadingStatus } from './book';

export function selectBooks(books: readonly Book[], query = '', status: ReadingStatus | 'all' = 'all', sort: 'title' | 'rating' = 'title'): Book[] {
  const term = query.trim().toLocaleLowerCase();
  return books.filter(book => (status === 'all' || book.status === status)
    && (!term || [book.title, ...book.authors].some(text => text.toLocaleLowerCase().includes(term))))
    .sort((a, b) => (sort === 'rating' ? (b.rating ?? 0) - (a.rating ?? 0) : 0)
      || a.title.localeCompare(b.title) || a.id.localeCompare(b.id));
}

export function readingStatistics(books: readonly Book[]) {
  const rated = books.filter(book => book.rating !== null);
  return {
    total: books.length,
    finished: books.filter(book => book.status === 'finished').length,
    currentlyReading: books.filter(book => book.status === 'currentlyReading').length,
    averageRating: rated.length ? rated.reduce((sum, book) => sum + book.rating!, 0) / rated.length : null,
  };
}

/** Keep precision here; round only when presenting the percentage. */
export function readingProgress(book: Pick<Book, 'currentPage' | 'totalPages'>): number | null {
  return book.totalPages === null ? null : book.currentPage / book.totalPages * 100;
}
