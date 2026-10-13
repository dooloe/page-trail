import { useRef, useState } from 'react';
import type { Book, ReadingStatus } from '../domain/book';
import { readingStatuses } from '../domain/book';
import { selectBooks } from '../domain/library';
import type { ReadState } from '../data/readState';
import { BookCard, statusLabels } from '../components/BookCard';
import styles from './Discover.module.css';
import { RemoveBook, type DeleteBook } from '../components/RemoveBook';

export function Library({ state, remove }: { state: ReadState<Book[]>; remove?: DeleteBook }) {
  const heading = useRef<HTMLHeadingElement>(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<ReadingStatus | 'all'>('all');
  const [sort, setSort] = useState<'title' | 'rating'>('title');
  const books = state.kind === 'success' ? selectBooks(state.value, query, status, sort) : [];
  return <section aria-labelledby="library-title">
    <h1 id="library-title" ref={heading} tabIndex={-1}>My Library</h1>
    {state.kind === 'loading' && <p role="status">Loading your bookshelf…</p>}
    {state.kind === 'error' && <p role="alert">{state.message}</p>}
    {state.kind === 'success' && (state.value.length === 0
      ? <p>Your bookshelf is empty. <a href="/discover">Discover your first book!</a></p>
      : <>
        <div className={styles.form}>
          <label className={styles.query}>Search your library<input type="search" value={query} onChange={event => setQuery(event.target.value)} /></label>
          <label>Reading status<select value={status} onChange={event => setStatus(event.target.value as ReadingStatus | 'all')}>
            <option value="all">All books</option>{readingStatuses.map(value => <option key={value} value={value}>{statusLabels[value]}</option>)}
          </select></label>
          <label>Sort books<select value={sort} onChange={event => setSort(event.target.value as 'title' | 'rating')}>
            <option value="title">Title: A to Z</option><option value="rating">Rating: highest first</option>
          </select></label>
        </div>
        <p role="status">{books.length ? `${books.length} books on your bookshelf.` : 'No books match. Try another search or filter.'}</p>
        {!books.length && <button onClick={() => { setQuery(''); setStatus('all'); }}>Clear search and filter</button>}
        <div className={styles.grid}>{books.map(book => <div key={book.id}><BookCard book={book} />
          {remove && <RemoveBook book={book} remove={remove} onRemoved={() => heading.current?.focus()} />}</div>)}</div>
      </>)}
  </section>;
}
