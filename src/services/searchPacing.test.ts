import { afterEach, expect, test, vi } from 'vitest';
import { SearchPacing } from './searchPacing';
afterEach(() => vi.useRealTimers());

test('concurrent requests start one second apart', async () => {
  vi.useFakeTimers(); vi.setSystemTime(0);
  const pacing = new SearchPacing();
  const starts: number[] = [];
  const calls = [1, 2, 3].map(async () => { await pacing.wait(new AbortController().signal); starts.push(Date.now()); });
  await vi.advanceTimersByTimeAsync(2000);
  await Promise.all(calls);
  expect(starts).toEqual([0, 1000, 2000]);
  expect(vi.getTimerCount()).toBe(0);
});

test('cancelled queued requests release timers and do not reserve later slots', async () => {
  vi.useFakeTimers(); vi.setSystemTime(0);
  const pacing = new SearchPacing();
  await pacing.wait(new AbortController().signal);
  const controller = new AbortController();
  const queued = pacing.wait(controller.signal);
  const rejected = expect(queued).rejects.toMatchObject({ name: 'AbortError' });
  controller.abort(); await rejected;
  expect(vi.getTimerCount()).toBe(0);
  const next = pacing.wait(new AbortController().signal);
  await vi.advanceTimersByTimeAsync(1000); await next;
  expect(Date.now()).toBe(1000);
});
