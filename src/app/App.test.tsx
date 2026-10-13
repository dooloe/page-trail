import 'fake-indexeddb/auto';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import App from './App';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

test('renders the application dashboard and navigation', async () => {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  render(<App />);

  expect(await screen.findByRole('heading', { level: 1, name: 'Your reading journey' })).toBeTruthy();
  expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeTruthy();
  expect(screen.getByRole('link', { name: 'My Library' }).getAttribute('href')).toBe('/library');
  expect(screen.getByRole('link', { name: 'Discover Books' }).getAttribute('href')).toBe('/discover');
  expect(screen.getByText('Your bookshelf, your progress, your thoughts.')).toBeTruthy();
});
