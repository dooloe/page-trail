import { cleanup, fireEvent, render, screen, waitFor, act } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { Discover } from './Discover';
import type { SearchResult } from '../services/searchBooks';

afterEach(cleanup);
function submit(query: string) {
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: query } });
  fireEvent.submit(screen.getByRole('button', { name: 'Search books' }).closest('form')!);
}

test('blank search shows feedback without requesting data', () => {
  const search = vi.fn(); render(<Discover search={search} />);
  submit(' ');
  expect(screen.getByRole('alert').textContent).toContain('Enter a title or author');
  expect(search).not.toHaveBeenCalled();
});

test('author search distinguishes empty results and retries original failed query', async () => {
  const search = vi.fn().mockResolvedValueOnce({ ok: false, error: 'network' }).mockResolvedValueOnce({ ok: true, books: [] });
  render(<Discover search={search} />);
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'author' } });
  submit('Tolkien');
  await screen.findByRole('alert');
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'changed draft' } });
  fireEvent.click(screen.getByRole('button', { name: 'Retry search' }));
  await screen.findByText(/No books found/);
  expect(search.mock.calls.map(call => call.slice(0, 2))).toEqual([['Tolkien', 'author'], ['Tolkien', 'author']]);
});

test('superseded responses cannot overwrite newer results and unmount cancels work', async () => {
  const resolvers: ((result: SearchResult) => void)[] = [];
  const search = vi.fn(() => new Promise<SearchResult>(resolve => resolvers.push(resolve)));
  const { unmount } = render(<Discover search={search} />);
  submit('old'); submit('new');
  expect((search.mock.calls as unknown as [string, string, AbortSignal][])[0][2].aborted).toBe(true);
  await act(async () => resolvers[1]({ ok: true, books: [] }));
  await act(async () => resolvers[0]({ ok: false, error: 'http' }));
  expect(screen.queryByRole('alert')).toBeNull();
  expect(screen.getByText(/No books found/)).toBeTruthy();
  submit('pending'); unmount();
  expect((search.mock.calls as unknown as [string, string, AbortSignal][])[2][2].aborted).toBe(true);
});

test('successful results provide preview metadata', async () => {
  const search = vi.fn().mockResolvedValue({ ok: true, books: [{ source: 'openLibrary', sourceWorkId: 'OL1W', title: 'Dune', authors: ['Frank Herbert'], coverUrl: null, totalPages: null }] });
  render(<Discover search={search} />); submit('Dune');
  await waitFor(() => expect(screen.getByRole('button', { name: 'Preview Dune' })).toBeTruthy());
  fireEvent.click(screen.getByRole('button', { name: 'Preview Dune' }));
  expect(screen.getByRole('region', { name: 'Preview of Dune' })).toBeTruthy();
  expect(screen.getByText('Page count unavailable')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Close preview' }));
  expect(screen.queryByRole('region', { name: 'Preview of Dune' })).toBeNull();
});

test('a late successful search cannot replace the newer successful result', async () => {
  const resolvers: ((result: SearchResult) => void)[] = [];
  const search = vi.fn(() => new Promise<SearchResult>(resolve => resolvers.push(resolve)));
  render(<Discover search={search} />); submit('old'); submit('new');
  const result = (title: string): SearchResult => ({ ok: true, books: [{ source: 'openLibrary', sourceWorkId: 'OL1W', title, authors: [], coverUrl: null, totalPages: null }] });
  await act(async () => resolvers[1](result('New result')));
  await act(async () => resolvers[0](result('Old result')));
  expect(screen.getByRole('button', { name: 'Preview New result' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Preview Old result' })).toBeNull();
});
