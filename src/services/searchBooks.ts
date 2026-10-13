import type { DiscoveryBook } from '../domain/book';
import { normalizeBook } from './normalizeBook';
import { searchPacing } from './searchPacing';

export type SearchMode = 'title' | 'author';
export type SearchResult = { ok: true; books: DiscoveryBook[] }
  | { ok: false; error: 'http' | 'network' | 'timeout' | 'malformed' | 'cancelled' };
export const SEARCH_LIMIT = 20;
export const SEARCH_TIMEOUT_MS = 10_000;

/** Only public metadata enters a request; caller cancellation is distinct from failure. */
export async function searchBooks(query: string, mode: SearchMode, signal?: AbortSignal): Promise<SearchResult> {
  if (signal?.aborted) return { ok: false, error: 'cancelled' };
  if (!query.trim()) return { ok: true, books: [] };
  const url = new URL('https://openlibrary.org/search.json');
  url.searchParams.set(mode, query.trim());
  url.searchParams.set('fields', 'key,title,author_name,cover_i,number_of_pages_median');
  url.searchParams.set('limit', String(SEARCH_LIMIT));
  const controller = new AbortController();
  let timedOut = false;
  const cancel = () => controller.abort();
  signal?.addEventListener('abort', cancel, { once: true });
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, SEARCH_TIMEOUT_MS);
  try {
    await searchPacing.wait(controller.signal);
    if (controller.signal.aborted) throw new DOMException('Cancelled', 'AbortError');
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) return { ok: false, error: 'http' };
    let data: unknown;
    try { data = await response.json(); }
    catch (cause) {
      if (controller.signal.aborted) throw cause;
      return { ok: false, error: 'malformed' };
    }
    if (signal?.aborted) return { ok: false, error: 'cancelled' };
    if (timedOut) return { ok: false, error: 'timeout' };
    if (!data || typeof data !== 'object' || !('docs' in data) || !Array.isArray(data.docs)) {
      return { ok: false, error: 'malformed' };
    }
    const books = data.docs.slice(0, SEARCH_LIMIT).map(normalizeBook)
      .filter((book): book is DiscoveryBook => book !== null);
    return { ok: true, books };
  } catch {
    return { ok: false, error: signal?.aborted ? 'cancelled' : timedOut ? 'timeout' : 'network' };
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', cancel);
  }
}
