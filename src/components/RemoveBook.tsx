import { useEffect, useRef, useState } from 'react';
import type { Book } from '../domain/book';

export type DeleteBook = (id: string) => Promise<{ ok: true } | { ok: false }>;

export function RemoveBook({ book, remove, onRemoved }: { book: Book; remove: DeleteBook; onRemoved: () => void }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const lock = useRef(false);
  useEffect(() => {
    if (open) { dialog.current?.showModal(); cancel.current?.focus(); }
  }, [open]);

  function dismiss() {
    if (lock.current) return;
    dialog.current?.close(); setOpen(false); setError(false);
    trigger.current?.focus();
  }
  async function confirm() {
    if (lock.current) return;
    lock.current = true; setPending(true); setError(false);
    try {
      const result = await remove(book.id);
      if (result.ok) { dialog.current?.close(); setOpen(false); onRemoved(); }
      else setError(true);
    } catch { setError(true); }
    finally { lock.current = false; setPending(false); }
  }
  return <>
    <button ref={trigger} type="button" onClick={() => setOpen(true)} aria-label={`Remove ${book.title}`}>Remove book</button>
    {open && <dialog ref={dialog} tabIndex={-1} aria-label={`Remove ${book.title}?`}
      onKeyDown={event => {
        if (event.key !== 'Tab') return;
        const buttons = dialog.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)');
        const first = buttons?.[0]; const last = buttons?.[buttons.length - 1];
        if (!first) { event.preventDefault(); dialog.current?.focus(); }
        else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }}
      onCancel={event => { event.preventDefault(); dismiss(); }}>
      <h2>Remove {book.title}?</h2>
      <p>This removes the book and its saved progress, rating, and personal note.</p>
      {error && <p role="alert">Could not remove the book. Please try again.</p>}
      {pending && <p role="status">Removing book…</p>}
      <button ref={cancel} type="button" disabled={pending} onClick={dismiss}>Keep book</button>
      <button type="button" disabled={pending} onClick={() => void confirm()}>Confirm removal</button>
    </dialog>}
  </>;
}
