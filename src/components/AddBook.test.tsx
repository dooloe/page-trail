import { cleanup, fireEvent, render, screen, act } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { AddBook } from './AddBook';
import { createBook, type Book } from '../domain/book';
const metadata = { source: 'openLibrary' as const, sourceWorkId: 'OL1W', title: 'Dune', authors: [], coverUrl: null, totalPages: null };
afterEach(cleanup);

test('existing books cannot be added again', () => {
  const add = vi.fn(); render(<AddBook book={metadata} saved add={add} />);
  fireEvent.click(screen.getByRole('button', { name: 'Already in Library' }));
  expect(add).not.toHaveBeenCalled();
});

test('subscription observing add then removal enables saving again', async () => {
  const add = vi.fn().mockResolvedValue({ ok: true, value: createBook(metadata) });
  const { rerender } = render(<AddBook book={metadata} saved={false} add={add} />);
  fireEvent.click(screen.getByRole('button', { name: 'Add to Library' }));
  await screen.findByText('Added to your library.');
  rerender(<AddBook book={metadata} saved add={add} />);
  rerender(<AddBook book={metadata} saved={false} add={add} />);
  expect((screen.getByRole('button', { name: 'Add to Library' }) as HTMLButtonElement).disabled).toBe(false);
});

test('pending addition prevents repeats and success waits for persistence', async () => {
  let resolve!: (result: { ok: true; value: Book }) => void;
  const add = vi.fn(() => new Promise<{ ok: true; value: Book }>(done => { resolve = done; }));
  render(<AddBook book={metadata} saved={false} add={add} />);
  fireEvent.click(screen.getByRole('button', { name: 'Add to Library' }));
  fireEvent.click(screen.getByRole('button', { name: 'Adding to Library…' }));
  expect(add).toHaveBeenCalledOnce();
  expect(screen.queryByRole('status')).toBeNull();
  await act(async () => resolve({ ok: true, value: createBook(metadata) }));
  expect(screen.getByRole('status').textContent).toBe('Added to your library.');
  expect((screen.getByRole('button') as HTMLButtonElement).disabled).toBe(true);
});

test('storage failure allows retry and concurrent duplicates become already-saved feedback', async () => {
  const add = vi.fn().mockResolvedValueOnce({ ok: false, error: 'storage' }).mockResolvedValueOnce({ ok: false, error: 'duplicate', book: createBook(metadata) });
  render(<AddBook book={metadata} saved={false} add={add} />);
  fireEvent.click(screen.getByRole('button', { name: 'Add to Library' }));
  await screen.findByRole('alert');
  fireEvent.click(screen.getByRole('button', { name: 'Add to Library' }));
  await screen.findByRole('button', { name: 'Already in Library' });
  expect(screen.queryByText('Added to your library.')).toBeNull();
  expect(add).toHaveBeenCalledTimes(2);
});
