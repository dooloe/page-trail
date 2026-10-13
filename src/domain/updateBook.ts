import { readingStatuses, type Book } from './book';

export type BookChanges = Partial<Pick<Book, 'status' | 'currentPage' | 'totalPages' | 'rating' | 'note'>>;
export type ValidationResult =
  | { ok: true; book: Book }
  | { ok: false; error: 'validation'; message: string };

const editableFields = ['status', 'currentPage', 'totalPages', 'rating', 'note'];
const integer = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && Number.isInteger(value);

/** Applies personal changes without mutation or timestamps; persistence owns updatedAt. */
export function applyBookChanges(book: Book, changes: BookChanges): ValidationResult {
  const invalid = (message: string): ValidationResult => ({ ok: false, error: 'validation', message });
  if (!changes || typeof changes !== 'object' || Array.isArray(changes)) return invalid('Changes must be an object.');
  if (Object.keys(changes).some(key => !editableFields.includes(key))) return invalid('Only personal reading fields can be updated.');
  const has = (key: keyof BookChanges) => Object.hasOwn(changes, key);
  const pagesChanged = has('currentPage') || has('totalPages');
  if (has('status') && pagesChanged) return invalid('Change status separately from pages.');
  if (has('status') && !readingStatuses.includes(changes.status!)) return invalid('Invalid reading status.');
  if (has('rating') && changes.rating !== null && (!integer(changes.rating) || changes.rating < 1 || changes.rating > 5)) return invalid('Rating must be an integer from 1 to 5, or null.');
  if (has('note') && typeof changes.note !== 'string') return invalid('Note must be plain text.');
  const next = { ...book, ...changes, authors: [...book.authors] };
  if (pagesChanged) {
    if (!integer(next.currentPage) || next.currentPage < 0) return invalid('Current page must be a nonnegative integer.');
    if (next.totalPages !== null && (!integer(next.totalPages) || next.totalPages <= 0)) return invalid('Total pages must be a positive integer or null.');
    if (next.totalPages !== null && next.currentPage > next.totalPages) return invalid('Current page exceeds total pages.');
    if (has('currentPage') && !has('totalPages') && (book.status !== 'currentlyReading' || next.totalPages === null)) return invalid('Progress entry requires a currently reading book with known total pages.');
    if (next.status === 'currentlyReading' && next.totalPages !== null && next.currentPage === next.totalPages) next.status = 'finished';
  }
  return { ok: true, book: next };
}
