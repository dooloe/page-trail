/** Space actual request starts by one second across searches in this tab. */
export class SearchPacing {
  private nextStart = 0;

  async wait(signal: AbortSignal): Promise<void> {
    while (true) {
      if (signal.aborted) throw new DOMException('Cancelled', 'AbortError');
      const delay = this.nextStart - Date.now();
      if (delay <= 0) { this.nextStart = Date.now() + 1000; return; }
      await new Promise<void>((resolve, reject) => {
        const cancel = () => { clearTimeout(timer); signal.removeEventListener('abort', cancel); reject(new DOMException('Cancelled', 'AbortError')); };
        const timer = setTimeout(() => { signal.removeEventListener('abort', cancel); resolve(); }, delay);
        signal.addEventListener('abort', cancel, { once: true });
      });
    }
  }
}

export const searchPacing = new SearchPacing();
