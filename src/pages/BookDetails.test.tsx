import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { BookDetails } from './BookDetails';
import { createBook } from '../domain/book';
afterEach(cleanup);
const book = { ...createBook({ source: 'openLibrary' as const, sourceWorkId: 'OL1W', title: 'Dune', authors: [], coverUrl: null, totalPages: 400 }), status: 'currentlyReading' as const, currentPage: 120 };

test('details show faithful progress and validate page combinations before saving', () => {
  const save = vi.fn(); render(<BookDetails state={{ kind: 'success', value: book }} save={save} />);
  expect(screen.getByText('30% completed')).toBeTruthy();
  fireEvent.change(screen.getByLabelText('Total pages'), { target: { value: '100' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save page count' }));
  expect(screen.getByRole('alert').textContent).toContain('exceeds');
  expect(save).not.toHaveBeenCalled();
  expect((screen.getByLabelText('Total pages') as HTMLInputElement).value).toBe('100');
});

test('failed note saves preserve inert drafts for retry and only announce persisted success', async () => {
  const save = vi.fn().mockResolvedValueOnce({ ok: false, error: 'storage' })
    .mockResolvedValueOnce({ ok: true, value: { ...book, note: '<script>private</script>' } });
  render(<BookDetails state={{ kind: 'success', value: book }} save={save} />);
  fireEvent.change(screen.getByLabelText('Personal note'), { target: { value: '<script>private</script>' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save note' }));
  await screen.findByRole('alert');
  expect(screen.queryByText('Changes saved.')).toBeNull();
  expect((screen.getByLabelText('Personal note') as HTMLTextAreaElement).value).toBe('<script>private</script>');
  fireEvent.click(screen.getByRole('button', { name: 'Save note' }));
  await screen.findByText('Changes saved.');
  expect(save).toHaveBeenLastCalledWith(book.id, { note: '<script>private</script>' });
  expect(document.querySelector('script')).toBeNull();
});

test('joint correction, progress, manual status, and clearing use separate validated writes', async () => {
  const save = vi.fn().mockImplementation(async (_id, changes) => ({ ok: true, value: { ...book, ...changes } }));
  render(<BookDetails state={{ kind: 'success', value: book }} save={save} />);
  fireEvent.change(screen.getByLabelText('Total pages'), { target: { value: '100' } });
  fireEvent.change(screen.getByLabelText('Corrected current page'), { target: { value: '90' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save page count' }));
  await waitFor(() => expect(save).toHaveBeenCalledWith(book.id, { totalPages: 100, currentPage: 90 }));
  await screen.findByText('Changes saved.');
  fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'finished' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save status' }));
  await waitFor(() => expect(save).toHaveBeenLastCalledWith(book.id, { status: 'finished' }));
  await screen.findByText('Changes saved.');
  fireEvent.click(screen.getByRole('button', { name: 'Clear rating' }));
  await waitFor(() => expect(save).toHaveBeenLastCalledWith(book.id, { rating: null }));
});

test('unknown totals gate progress and missing records provide a library return', () => {
  const save = vi.fn();
  const { rerender } = render(<BookDetails state={{ kind: 'success', value: { ...book, totalPages: null } }} save={save} />);
  expect(screen.queryByRole('progressbar')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Save progress' })).toBeNull();
  rerender(<BookDetails state={{ kind: 'success', value: null }} save={save} />);
  expect(screen.getByRole('heading', { name: 'Book not found' })).toBeTruthy();
  expect(screen.getByRole('link', { name: 'Return to My Library' })).toBeTruthy();
});

test('subscribed changes refresh untouched fields while preserving unsaved drafts', async () => {
  const save = vi.fn().mockImplementation(async (_id, changes) => ({ ok: true, value: { ...book, ...changes } }));
  const { rerender } = render(<BookDetails state={{ kind: 'success', value: book }} save={save} />);
  fireEvent.change(screen.getByLabelText('Personal note'), { target: { value: 'My unsaved thoughts' } });
  const updated = { ...book, currentPage: 200, rating: 4, note: 'Saved in another tab' };
  rerender(<BookDetails state={{ kind: 'success', value: updated }} save={save} />);
  expect((screen.getByLabelText('Current page') as HTMLInputElement).value).toBe('200');
  expect((screen.getByLabelText('Corrected current page') as HTMLInputElement).value).toBe('200');
  expect((screen.getByLabelText('Rating') as HTMLSelectElement).value).toBe('4');
  expect((screen.getByLabelText('Personal note') as HTMLTextAreaElement).value).toBe('My unsaved thoughts');
  fireEvent.change(screen.getByLabelText('Total pages'), { target: { value: '500' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save page count' }));
  await waitFor(() => expect(save).toHaveBeenCalledWith(book.id, { totalPages: 500 }));
});

test('failed saves and subscribed updates preserve page-correction drafts', async () => {
  const save = vi.fn().mockResolvedValue({ ok: false, error: 'storage' });
  const { rerender } = render(<BookDetails state={{ kind: 'success', value: book }} save={save} />);
  fireEvent.change(screen.getByLabelText('Total pages'), { target: { value: '100' } });
  fireEvent.change(screen.getByLabelText('Corrected current page'), { target: { value: '90' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save page count' }));
  await screen.findByRole('alert');
  rerender(<BookDetails state={{ kind: 'success', value: { ...book, currentPage: 200, totalPages: 600 } }} save={save} />);
  expect((screen.getByLabelText('Total pages') as HTMLInputElement).value).toBe('100');
  expect((screen.getByLabelText('Corrected current page') as HTMLInputElement).value).toBe('90');
  fireEvent.click(screen.getByRole('button', { name: 'Save page count' }));
  await waitFor(() => expect(save).toHaveBeenLastCalledWith(book.id, { totalPages: 100, currentPage: 90 }));
});

test('saving page totals preserves drafts in the separate progress and status forms', async () => {
  const updated = { ...book, totalPages: 500 };
  const save = vi.fn().mockResolvedValue({ ok: true, value: updated });
  const { rerender } = render(<BookDetails state={{ kind: 'success', value: book }} save={save} />);
  fireEvent.change(screen.getByLabelText('Current page'), { target: { value: '150' } });
  fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'finished' } });
  fireEvent.change(screen.getByLabelText('Total pages'), { target: { value: '500' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save page count' }));
  await screen.findByText('Changes saved.');
  rerender(<BookDetails state={{ kind: 'success', value: updated }} save={save} />);
  expect((screen.getByLabelText('Current page') as HTMLInputElement).value).toBe('150');
  expect((screen.getByLabelText('Status') as HTMLSelectElement).value).toBe('finished');
});

test('details distinguish loading/error states and reset drafts for a different book ID', () => {
  const save = vi.fn();
  const { rerender } = render(<BookDetails state={{ kind: 'loading' }} save={save} />);
  expect(screen.getByRole('status').textContent).toContain('Loading');
  rerender(<BookDetails state={{ kind: 'error', message: 'Storage unavailable' }} save={save} />);
  expect(screen.getByRole('alert').textContent).toBe('Storage unavailable');
  expect(screen.getByRole('link', { name: 'Return to My Library' })).toBeTruthy();
  rerender(<BookDetails state={{ kind: 'success', value: book }} save={save} />);
  fireEvent.change(screen.getByLabelText('Personal note'), { target: { value: 'Unsaved first book' } });
  rerender(<BookDetails state={{ kind: 'success', value: { ...book, id: 'another', title: 'Another book', note: 'Saved second book' } }} save={save} />);
  expect(screen.getByRole('heading', { name: 'Another book' })).toBeTruthy();
  expect((screen.getByLabelText('Personal note') as HTMLTextAreaElement).value).toBe('Saved second book');
});
