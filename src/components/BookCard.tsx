import type { Book, DiscoveryBook, ReadingStatus } from '../domain/book';
import { BookCover } from './BookCover';
import styles from './BookCard.module.css';

export const statusLabels: Record<ReadingStatus, string> = {
  wantToRead: 'Want to Read', currentlyReading: 'Currently Reading', finished: 'Finished',
};

type Props = { book: Book; onPreview?: never } | { book: DiscoveryBook; onPreview: () => void };

export function BookCard({ book, onPreview }: Props) {
  const saved = 'id' in book;
  return <article className={styles.card}>
    <BookCover key={`${book.sourceWorkId}:${book.coverUrl}`} title={book.title} coverUrl={book.coverUrl} />
    <div className={styles.body}>
      <h2 className={styles.title}>{saved
        ? <a href={`/books/${encodeURIComponent(book.id)}`}>{book.title}</a>
        : book.title}</h2>
      <p className={styles.authors}>{book.authors.length ? book.authors.join(', ') : 'Unknown author'}</p>
      {saved && <><p className={styles.status}>{statusLabels[book.status]}</p>
        <p>{book.rating === null ? 'Not rated yet' : `${book.rating} of 5 stars`}</p></>}
      {!saved && <button type="button" onClick={onPreview} aria-label={`Preview ${book.title}`}>Preview book</button>}
    </div>
  </article>;
}
