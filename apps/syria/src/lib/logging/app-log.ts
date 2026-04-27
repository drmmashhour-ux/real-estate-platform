/** Server log prefix for SYBNB / Darlink — do not log secrets. */
export const APP_LOG_PREFIX = "[SYBNB]";

export function appLog(...args: unknown[]): void {
  console.log(APP_LOG_PREFIX, ...args);
}

export function appWarn(...args: unknown[]): void {
  console.warn(APP_LOG_PREFIX, ...args);
}
