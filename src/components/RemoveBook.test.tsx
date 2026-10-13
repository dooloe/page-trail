import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { RemoveBook } from './RemoveBook';
import { createBook } from '../domain/book';
const book = createBook({ source: 'openLibrary', sourceWorkId: 'OL1W', title: 'Dune', authors: [], coverUrl: null, totalPages: null });
const originalShow = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal');
const originalClose = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'close');
beforeEach(() => {
  // jsdom lacks native modal behavior; actual browser focus containment remains to verify.
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value: function (this: HTMLDialogElement) { this.setAttribute('open', ''); } });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value: function (this: HTMLDialogElement) { this.removeAttribute('open'); } });
});
afterEach(() => {
  cleanup();
  if (originalShow) Object.defineProperty(HTMLDialogElement.prototype, 'showModal', originalShow);
  else Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
  if (originalClose) Object.defineProperty(HTMLDialogElement.prototype, 'close', originalClose);
  else Reflect.deleteProperty(HTMLDialogElement.prototype, 'close');
});

test('cancel preserves storage and restores trigger focus', () => {
  const remove = vi.fn(); render(<RemoveBook book={book} remove={remove} onRemoved={vi.fn()} />);
  const trigger = screen.getByRole('button', { name: 'Remove Dune' });
  fireEvent.click(trigger);
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Keep book' }));
  fireEvent.click(screen.getByRole('button', { name: 'Keep book' }));
  expect(remove).not.toHaveBeenCalled();
  expect(document.activeElement).toBe(trigger);
});

test('failed removal remains open for retry; success invokes navigation/focus callback', async () => {
  const remove = vi.fn().mockResolvedValueOnce({ ok: false }).mockResolvedValueOnce({ ok: true });
  const onRemoved = vi.fn(); render(<RemoveBook book={book} remove={remove} onRemoved={onRemoved} />);
  fireEvent.click(screen.getByRole('button', { name: 'Remove Dune' }));
  fireEvent.click(screen.getByRole('button', { name: 'Confirm removal' }));
  await screen.findByRole('alert');
  expect(onRemoved).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Confirm removal' }));
  await vi.waitFor(() => expect(onRemoved).toHaveBeenCalledOnce());
  expect(remove).toHaveBeenLastCalledWith(book.id);
});
