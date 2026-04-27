/** Server-side log prefix for LECIPM — use for new diagnostics; do not log secrets. */
export const APP_LOG_PREFIX = "[LECIPM]";

export function appLog(...args: unknown[]): void {
  console.log(APP_LOG_PREFIX, ...args);
}

export function appWarn(...args: unknown[]): void {
  console.warn(APP_LOG_PREFIX, ...args);
}
