import { afterEach, expect, test, vi } from 'vitest';
import { searchBooks, SEARCH_LIMIT, SEARCH_TIMEOUT_MS } from './searchBooks';
vi.mock('./searchPacing', () => ({ searchPacing: { wait: async () => {} } }));

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });
const mockResponse = (data: unknown, ok = true) => vi.fn().mockResolvedValue({ ok, json: async () => data });

test.each(['title', 'author'] as const)('encodes %s search, bounds results, and requests only metadata', async mode => {
  const fetcher = mockResponse({ docs: [{ key: 'OL1W', title: 'Book' }, { title: 'invalid' }] });
  vi.stubGlobal('fetch', fetcher);
  expect(await searchBooks(' A & B + café ', mode)).toMatchObject({ ok: true, books: [{ title: 'Book' }] });
  const url = fetcher.mock.calls[0][0] as URL;
  expect(url.searchParams.get(mode)).toBe('A & B + café');
  expect(url.searchParams.get('limit')).toBe(String(SEARCH_LIMIT));
  expect([...url.searchParams.keys()]).toEqual([mode, 'fields', 'limit']);
  expect(url.searchParams.get('fields')).toBe('key,title,author_name,cover_i,number_of_pages_median');
});

test('blank input and pre-cancellation make no request', async () => {
  const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
  expect(await searchBooks(' ', 'title')).toEqual({ ok: true, books: [] });
  expect(await searchBooks('book', 'title', AbortSignal.abort())).toEqual({ ok: false, error: 'cancelled' });
  expect(fetcher).not.toHaveBeenCalled();
});

test.each([null, [], {}, { docs: 'bad' }])('rejects malformed envelope %s', async data => {
  vi.stubGlobal('fetch', mockResponse(data));
  expect(await searchBooks('book', 'title')).toEqual({ ok: false, error: 'malformed' });
});

test('distinguishes empty, HTTP, network and invalid JSON outcomes', async () => {
  vi.stubGlobal('fetch', mockResponse({ docs: [] }));
  expect(await searchBooks('book', 'title')).toEqual({ ok: true, books: [] });
  vi.stubGlobal('fetch', mockResponse({}, false));
  expect(await searchBooks('book', 'title')).toEqual({ ok: false, error: 'http' });
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));
  expect(await searchBooks('book', 'title')).toEqual({ ok: false, error: 'network' });
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => { throw new SyntaxError(); } }));
  expect(await searchBooks('book', 'title')).toEqual({ ok: false, error: 'malformed' });
});

test.each(['timeout', 'cancelled'] as const)('%s aborts pending fetch and cleans up', async error => {
  vi.useFakeTimers();
  vi.stubGlobal('fetch', vi.fn((_url, { signal }: { signal: AbortSignal }) => new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')), { once: true });
  })));
  const caller = new AbortController();
  const remove = vi.spyOn(caller.signal, 'removeEventListener');
  const pending = searchBooks('book', 'title', caller.signal);
  if (error === 'timeout') await vi.advanceTimersByTimeAsync(SEARCH_TIMEOUT_MS);
  else caller.abort();
  expect(await pending).toEqual({ ok: false, error });
  expect(remove).toHaveBeenCalledWith('abort', expect.any(Function));
  expect(vi.getTimerCount()).toBe(0);
});
