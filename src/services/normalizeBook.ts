import type { DiscoveryBook } from '../domain/book';

/** Accept bare work IDs and API work paths; store the bare OL…W identity. */
export function normalizeWorkId(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const match = /^(?:\/works\/)?(OL[1-9]\d*W)$/.exec(value.trim());
  return match?.[1] ?? null;
}

const positiveInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value > 0;

export function normalizeBook(document: unknown): DiscoveryBook | null {
  if (!document || typeof document !== 'object' || Array.isArray(document)) return null;
  const data = document as Record<string, unknown>;
  const sourceWorkId = normalizeWorkId(data.key);
  const title = typeof data.title === 'string' ? data.title.trim() : '';
  if (!sourceWorkId || !title) return null;
  const authors = Array.isArray(data.author_name)
    ? data.author_name.filter((author): author is string => typeof author === 'string')
      .map(author => author.trim()).filter(Boolean)
    : [];
  return {
    source: 'openLibrary', sourceWorkId, title, authors,
    coverUrl: positiveInteger(data.cover_i)
      ? `https://covers.openlibrary.org/b/id/${data.cover_i}-M.jpg?default=false` : null,
    totalPages: positiveInteger(data.number_of_pages_median) ? data.number_of_pages_median : null,
  };
}
