export type ReadState<T> = { kind: 'loading' } | { kind: 'error'; message: string }
  | { kind: 'success'; value: T };
