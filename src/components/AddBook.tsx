import { useEffect, useRef, useState } from 'react';
import type { Book, DiscoveryBook } from '../domain/book';

export type AddBookOperation = (book: DiscoveryBook) => Promise<
  { ok: true; value: Book } | { ok: false; error: string; book?: Book }>;

export function AddBook({ book, saved, add }: { book: DiscoveryBook; saved: boolean; add: AddBookOperation }) {
  const [pending, setPending] = useState(false);
  const [added, setAdded] = useState(false);
  const [duplicate, setDuplicate] = useState(false);
  const [error, setError] = useState(false);
  const lock = useRef(false);
  // Once subscribers observe the saved record, they own duplicate state.
  // A later removal must enable saving again while this preview remains open.
  useEffect(() => {
    if (saved) { setAdded(false); setDuplicate(false); }
  }, [saved]);
  async function save() {
    if (lock.current || saved || added || duplicate) return;
    lock.current = true; setPending(true); setError(false);
    try {
      const result = await add(book);
      if (result.ok) setAdded(true);
      else if (result.error === 'duplicate') setDuplicate(true);
      else setError(true);
    } catch { setError(true); }
    finally { lock.current = false; setPending(false); }
  }
  return <div>
    <button type="button" disabled={pending || saved || added || duplicate} onClick={() => void save()}>
      {pending ? 'Adding to Library…' : saved || duplicate || added ? 'Already in Library' : 'Add to Library'}
    </button>
    {added && <p role="status">Added to your library.</p>}
    {duplicate && <p role="status">This book is already in your library.</p>}
    {error && <p role="alert">Could not add this book. Please try again.</p>}
  </div>;
}
