import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { BookCard } from './BookCard';
import { BookCover } from './BookCover';
import { createBook, type DiscoveryBook } from '../domain/book';

afterEach(cleanup);
const metadata: DiscoveryBook = { source: 'openLibrary', sourceWorkId: 'OL1W', title: 'A book', authors: [], coverUrl: null, totalPages: null };

test('saved card exposes title link, author fallback and supplied personal data', () => {
  const book = { ...createBook(metadata), status: 'finished' as const, rating: 4 };
  render(<BookCard book={book} />);
  expect(screen.getByRole('link', { name: 'A book' }).getAttribute('href')).toBe(`/books/${book.id}`);
  expect(screen.getByText('Unknown author')).toBeTruthy();
  expect(screen.getByText('Finished')).toBeTruthy();
  expect(screen.getByText('4 of 5 stars')).toBeTruthy();
  expect(screen.getByRole('img').getAttribute('src')).toBe('/cover-fallback.svg');
});

test('discovery preview exposes an action without invented personal fields', () => {
  const preview = vi.fn();
  render(<BookCard book={{ ...metadata, authors: ['One', 'Two'] }} onPreview={preview} />);
  fireEvent.click(screen.getByRole('button', { name: 'Preview A book' }));
  expect(preview).toHaveBeenCalledOnce();
  expect(screen.getByText('One, Two')).toBeTruthy();
  expect(screen.queryByText('Want to Read')).toBeNull();
  expect(screen.queryByText('Not rated yet')).toBeNull();
});

test('failed covers fall back once and a changed URL can load', () => {
  const { rerender } = render(<BookCover title="Book" coverUrl="https://example.com/first.jpg" />);
  fireEvent.error(screen.getByRole('img'));
  expect(screen.getByRole('img').getAttribute('src')).toBe('/cover-fallback.svg');
  fireEvent.error(screen.getByRole('img'));
  expect(screen.getByRole('img').getAttribute('src')).toBe('/cover-fallback.svg');
  rerender(<BookCover title="Book" coverUrl="https://example.com/second.jpg" />);
  expect(screen.getByRole('img').getAttribute('src')).toBe('https://example.com/second.jpg');
});
