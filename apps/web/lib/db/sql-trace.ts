/** SQL tracing — stub for deployment recovery. */
export function traceSQL<T>(label: string, fn: () => T): T {
  return fn();
}
