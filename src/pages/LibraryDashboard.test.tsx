import { afterEach, expect, test } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Library } from './Library';
import { Dashboard } from './Dashboard';
import { createBook } from '../domain/book';

afterEach(cleanup);
const books = [
  { ...createBook({ source: 'openLibrary', sourceWorkId: 'OL1W', title: 'Dune', authors: ['Frank Herbert'], coverUrl: null, totalPages: 400 }), status: 'finished' as const, rating: 5 },
  { ...createBook({ source: 'openLibrary', sourceWorkId: 'OL2W', title: 'Anne', authors: ['Montgomery'], coverUrl: null, totalPages: null }), status: 'currentlyReading' as const, rating: 4 },
];

test('library combines controls and recovers from no matches', () => {
  render(<Library state={{ kind: 'success', value: books }} />);
  expect(screen.getAllByRole('link').map(link => link.textContent)).toEqual(['Anne', 'Dune']);
  fireEvent.change(screen.getByLabelText('Sort books'), { target: { value: 'rating' } });
  expect(screen.getAllByRole('link').map(link => link.textContent)).toEqual(['Dune', 'Anne']);
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'HERBERT' } });
  expect(screen.getAllByRole('link')).toHaveLength(1);
  fireEvent.change(screen.getByLabelText('Reading status'), { target: { value: 'currentlyReading' } });
  expect(screen.getByRole('status').textContent).toContain('No books match');
  fireEvent.click(screen.getByRole('button', { name: 'Clear search and filter' }));
  expect(screen.getAllByRole('link')).toHaveLength(2);
});

test.each([Library, Dashboard])('data views distinguish loading, errors and empty success', View => {
  const { rerender } = render(<View state={{ kind: 'loading' }} />);
  expect(screen.getByRole('status').textContent).toContain('Loading');
  rerender(<View state={{ kind: 'error', message: 'Storage unavailable' }} />);
  expect(screen.getByRole('alert').textContent).toBe('Storage unavailable');
  expect(screen.queryByText('No ratings yet')).toBeNull();
  rerender(<View state={{ kind: 'success', value: [] }} />);
  expect(screen.queryByRole('alert')).toBeNull();
  expect(screen.getByRole('link', { name: /Discover your first/ })).toBeTruthy();
});

test('dashboard updates supplied records and excludes cleared ratings', () => {
  const { rerender } = render(<Dashboard state={{ kind: 'success', value: books }} />);
  expect(screen.getByText('4.5 of 5 stars')).toBeTruthy();
  expect(screen.getByText('Total books').nextElementSibling?.textContent).toBe('2');
  expect(screen.getByText('Finished').nextElementSibling?.textContent).toBe('1');
  expect(screen.getByText('Currently reading').nextElementSibling?.textContent).toBe('1');
  rerender(<Dashboard state={{ kind: 'success', value: [{ ...books[0], rating: null }] }} />);
  expect(screen.getByText('No ratings yet')).toBeTruthy();
  expect(screen.getByText('Total books').nextElementSibling?.textContent).toBe('1');
  expect(screen.getByText('Currently reading').nextElementSibling?.textContent).toBe('0');
});

test('dashboard rounds non-terminating averages to one decimal place', () => {
  render(<Dashboard state={{ kind: 'success', value: [books[0], books[1], { ...books[1], id: 'third' }] }} />);
  expect(screen.getByText('4.3 of 5 stars')).toBeTruthy();
});
