import type { Book } from '../domain/book';
import { readingStatistics } from '../domain/library';
import type { ReadState } from '../data/readState';
import styles from './Dashboard.module.css';

export function Dashboard({ state }: { state: ReadState<Book[]> }) {
  const stats = state.kind === 'success' ? readingStatistics(state.value) : null;
  return <section aria-labelledby="dashboard-title">
    <h1 id="dashboard-title">Your reading journey</h1>
    {state.kind === 'loading' && <p role="status">Loading your reading activity…</p>}
    {state.kind === 'error' && <p role="alert">{state.message}</p>}
    {stats && <>
      <dl className={styles.stats}>
        <div><dt>Total books</dt><dd>{stats.total}</dd></div>
        <div><dt>Finished</dt><dd>{stats.finished}</dd></div>
        <div><dt>Currently reading</dt><dd>{stats.currentlyReading}</dd></div>
        <div><dt>Average rating</dt><dd>{stats.averageRating === null ? 'No ratings yet' : `${stats.averageRating.toFixed(1)} of 5 stars`}</dd></div>
      </dl>
      {stats.total === 0 && <p>Your reading journey starts with a book. <a href="/discover">Discover your first read.</a></p>}
      <a href="/library">Visit your bookshelf</a>
    </>}
  </section>;
}
