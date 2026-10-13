import { useEffect, useRef, useState, type FormEvent } from 'react';
import { BookCard } from '../components/BookCard';
import { BookCover } from '../components/BookCover';
import type { DiscoveryBook } from '../domain/book';
import { searchBooks, type SearchMode, type SearchResult } from '../services/searchBooks';
import styles from './Discover.module.css';
import { AddBook, type AddBookOperation } from '../components/AddBook';
import type { ReadState } from '../data/readState';
import type { Book } from '../domain/book';

type Search = typeof searchBooks;
type State = { kind: 'idle' | 'loading' } | { kind: 'success'; books: DiscoveryBook[] }
  | { kind: 'error'; message: string };
const errors = {
  http: 'Open Library could not complete the search. Please try again.',
  network: 'Unable to connect to Open Library. Check your connection and try again.',
  timeout: 'The search took too long. Please try again.',
  malformed: 'Open Library returned an unreadable response. Please try again.',
  cancelled: 'Search cancelled.',
};

export function Discover({ search = searchBooks, library, add }: { search?: Search; library?: ReadState<Book[]>; add?: AddBookOperation }) {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<SearchMode>('title');
  const [state, setState] = useState<State>({ kind: 'idle' });
  const [preview, setPreview] = useState<DiscoveryBook | null>(null);
  const previewHeading = useRef<HTMLHeadingElement>(null);
  const previewTrigger = useRef<HTMLElement | null>(null);
  const pending = useRef<AbortController | null>(null);
  const lastSearch = useRef<{ query: string; mode: SearchMode } | null>(null);
  useEffect(() => () => pending.current?.abort(), []);
  useEffect(() => { if (preview) previewHeading.current?.focus(); }, [preview]);

  async function run(value: string, field: SearchMode) {
    pending.current?.abort();
    const controller = new AbortController();
    pending.current = controller;
    setPreview(null);
    if (!value.trim()) {
      setState({ kind: 'error', message: 'Enter a title or author to search.' });
      lastSearch.current = null;
      return;
    }
    lastSearch.current = { query: value, mode: field };
    setState({ kind: 'loading' });
    let result: SearchResult;
    try { result = await search(value, field, controller.signal); }
    catch { result = { ok: false, error: 'network' }; }
    if (controller.signal.aborted || pending.current !== controller) return;
    setState(result.ok ? { kind: 'success', books: result.books }
      : { kind: 'error', message: errors[result.error] });
  }

  function submit(event: FormEvent) { event.preventDefault(); void run(query, mode); }
  return <section aria-labelledby="discover-title">
    <h1 id="discover-title">Discover Books</h1>
    <p>Find your next read by title or author.</p>
    <form onSubmit={submit} className={styles.form}>
      <label>Search by<select value={mode} onChange={event => setMode(event.target.value as SearchMode)}>
        <option value="title">Title</option><option value="author">Author</option>
      </select></label>
      <label className={styles.query}>Title or author<input type="search" value={query}
        onChange={event => setQuery(event.target.value)} /></label>
      <button type="submit">Search books</button>
    </form>
    {state.kind === 'idle' && <p>Search for a book to start exploring.</p>}
    {state.kind === 'loading' && <p role="status">Searching Open Library…</p>}
    {state.kind === 'error' && <div><p role="alert">{state.message}</p>
      {lastSearch.current && <button type="button" onClick={() => {
        const previous = lastSearch.current;
        if (previous) void run(previous.query, previous.mode);
      }}>Retry search</button>}</div>}
    {state.kind === 'success' && <>
      <p role="status">{state.books.length ? `${state.books.length} books found.` : 'No books found. Try another title or author.'}</p>
      <div className={styles.grid}>{state.books.map(book => <BookCard key={book.sourceWorkId} book={book}
        onPreview={() => {
          previewTrigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
          setPreview(book);
        }} />)}</div>
    </>}
    {preview && <section className={styles.preview} aria-label={`Preview of ${preview.title}`}>
      <h2 ref={previewHeading} tabIndex={-1}>{preview.title}</h2>
      <div className={styles.previewCover}><BookCover key={preview.sourceWorkId} title={preview.title} coverUrl={preview.coverUrl} /></div>
      <p>{preview.authors.join(', ') || 'Unknown author'}</p>
      <p>{preview.totalPages === null ? 'Page count unavailable' : `${preview.totalPages} pages`}</p>
      {add && library?.kind === 'success' && <AddBook key={preview.sourceWorkId} book={preview}
        saved={library.value.some(book => book.source === preview.source && book.sourceWorkId === preview.sourceWorkId)} add={add} />}
      {add && library?.kind === 'loading' && <p role="status">Checking your library…</p>}
      {add && library?.kind === 'error' && <p role="alert">{library.message}</p>}
      <button type="button" onClick={() => { setPreview(null); previewTrigger.current?.focus(); }}>Close preview</button>
    </section>}
  </section>;
}
