import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { Book } from '../domain/book';
import { readingStatuses } from '../domain/book';
import { applyBookChanges, type BookChanges } from '../domain/updateBook';
import { readingProgress } from '../domain/library';
import type { ReadState } from '../data/readState';
import { BookCover } from '../components/BookCover';
import { statusLabels } from '../components/BookCard';
import styles from './BookDetails.module.css';
import { RemoveBook, type DeleteBook } from '../components/RemoveBook';

export type SaveBook = (id: string, changes: BookChanges) => Promise<
  { ok: true; value: Book } | { ok: false; error: string; message?: string }>;

/** Follow subscribed values unless the reader has an unsaved edit. */
function useDraft<T>(saved: T): [T, (value: T) => void] {
  const [state, setState] = useState({ saved, value: saved });
  let value = state.value;
  if (state.saved !== saved) {
    value = state.value === state.saved ? saved : state.value;
    setState({ saved, value });
  }
  return [value, next => setState({ saved, value: next })];
}

export function BookDetails({ state, save, remove, onRemoved }: { state: ReadState<Book | null>; save: SaveBook; remove?: DeleteBook; onRemoved?: () => void }) {
  if (state.kind === 'loading') return <p role="status">Loading your book…</p>;
  if (state.kind === 'error') return <section><h1>Book details unavailable</h1>
    <p role="alert">{state.message}</p><a href="/library">Return to My Library</a></section>;
  if (!state.value) return <section><h1>Book not found</h1><p>This book may have been removed.</p><a href="/library">Return to My Library</a></section>;
  return <DetailsEditor key={state.value.id} book={state.value} save={save} remove={remove} onRemoved={onRemoved} />;
}

function DetailsEditor({ book, save, remove, onRemoved }: { book: Book; save: SaveBook; remove?: DeleteBook; onRemoved?: () => void }) {
  const [status, setStatus] = useDraft(book.status);
  const [total, setTotal] = useDraft(book.totalPages?.toString() ?? '');
  const [position, setPosition] = useDraft(String(book.currentPage));
  const [progress, setProgress] = useDraft(String(book.currentPage));
  const [rating, setRating] = useDraft(book.rating?.toString() ?? '');
  const [note, setNote] = useDraft(book.note);
  const [pending, setPending] = useState(false);
  const lock = useRef(false);
  const statusControl = useRef<HTMLSelectElement>(null);
  const restoreStatusFocus = useRef(false);
  const [feedback, setFeedback] = useState<{ error: boolean; text: string } | null>(null);
  const percentage = readingProgress(book);
  useEffect(() => {
    if (!pending && book.status === 'finished' && restoreStatusFocus.current) {
      restoreStatusFocus.current = false;
      statusControl.current?.focus();
    }
  }, [pending, book.status]);

  async function persist(changes: BookChanges) {
    if (lock.current) return;
    const validated = applyBookChanges(book, changes);
    if (!validated.ok) { setFeedback({ error: true, text: validated.message }); return; }
    lock.current = true; setPending(true); setFeedback(null);
    try {
      const result = await save(book.id, changes);
      if (!result.ok) setFeedback({ error: true, text: result.message ?? (result.error === 'missing' ? 'This book was removed. Return to your library.' : 'Could not save your changes. Please try again.') });
      else {
        if ('currentPage' in changes && !('totalPages' in changes) && result.value.status === 'finished') restoreStatusFocus.current = true;
        if ('status' in changes) setStatus(result.value.status);
        if ('currentPage' in changes) {
          if ('totalPages' in changes) setPosition(String(result.value.currentPage));
          else setProgress(String(result.value.currentPage));
        }
        if ('totalPages' in changes) setTotal(result.value.totalPages?.toString() ?? '');
        setFeedback({ error: false, text: 'Changes saved.' });
      }
    } catch { setFeedback({ error: true, text: 'Could not save your changes. Please try again.' }); }
    finally { lock.current = false; setPending(false); }
  }
  const submit = (changes: () => BookChanges) => (event: FormEvent) => { event.preventDefault(); void persist(changes()); };
  const numeric = (value: string) => value.trim() ? Number(value) : NaN;

  return <section aria-labelledby="book-title">
    <a href="/library">Back to My Library</a>
    <div className={styles.metadata}><BookCover title={book.title} coverUrl={book.coverUrl} />
      <div><h1 id="book-title">{book.title}</h1><p>{book.authors.join(', ') || 'Unknown author'}</p>
        <p>{statusLabels[book.status]}</p><p>{book.totalPages === null ? 'Total pages unknown' : `${book.currentPage} of ${book.totalPages} pages`}</p>
        {percentage === null ? <p>Progress unknown. Enter the total page count below.</p> : <>
          <progress value={book.currentPage} max={book.totalPages!} aria-label="Reading progress" />
          <p>{Math.round(percentage)}% completed</p></>}
      </div>
    </div>
    {feedback && <p role={feedback.error ? 'alert' : 'status'}>{feedback.text}</p>}
    {pending && <p role="status">Saving changes…</p>}
    <fieldset disabled={pending} className={styles.editors}><legend>Reading details</legend>
      <form onSubmit={submit(() => ({ status }))}><h2>Reading status</h2>
        <label>Status<select ref={statusControl} value={status} onChange={event => setStatus(event.target.value as Book['status'])}>
          {readingStatuses.map(value => <option key={value} value={value}>{statusLabels[value]}</option>)}
        </select></label><button>Save status</button></form>
      <form onSubmit={submit(() => ({ totalPages: numeric(total),
        ...(position !== String(book.currentPage) ? { currentPage: numeric(position) } : {}) }))} noValidate>
        <h2>Page count</h2><p>Correct the current page too if the new total is below your saved position.</p>
        <label>Total pages<input type="number" min="1" step="1" value={total} onChange={event => setTotal(event.target.value)} /></label>
        <label>Corrected current page<input type="number" min="0" step="1" value={position} onChange={event => setPosition(event.target.value)} /></label>
        <button>Save page count</button>
      </form>
      {book.status === 'currentlyReading' && book.totalPages !== null
        ? <form onSubmit={submit(() => ({ currentPage: numeric(progress) }))} noValidate><h2>Reading progress</h2>
          <label>Current page<input type="number" min="0" max={book.totalPages} step="1" value={progress} onChange={event => setProgress(event.target.value)} /></label>
          <button>Save progress</button></form>
        : <p>To enter progress, choose Currently Reading and supply a total page count.</p>}
      <form onSubmit={submit(() => ({ rating: rating === '' ? null : Number(rating) }))}>
        <h2>Your rating</h2><label>Rating<select value={rating} onChange={event => setRating(event.target.value)}>
          <option value="">No rating</option>{[1, 2, 3, 4, 5].map(value => <option key={value} value={value}>{value} {value === 1 ? 'star' : 'stars'}</option>)}
        </select></label><button>Save rating</button>
        <p>{book.rating === null ? 'Not rated yet' : `Saved rating: ${book.rating} of 5 stars`}</p>
        <button type="button" onClick={() => { setRating(''); void persist({ rating: null }); }}>Clear rating</button>
      </form>
      <form onSubmit={submit(() => ({ note }))}><h2>Your private note</h2>
        {book.note === '' && <p>No note saved yet.</p>}
        <label>Personal note<textarea rows={6} value={note} onChange={event => setNote(event.target.value)} /></label>
        <button>Save note</button><button type="button" onClick={() => { setNote(''); void persist({ note: '' }); }}>Clear note</button>
      </form>
    </fieldset>
    {remove && onRemoved && <RemoveBook book={book} remove={remove} onRemoved={onRemoved} />}
  </section>;
}
