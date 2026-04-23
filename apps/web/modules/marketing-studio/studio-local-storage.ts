/** v1 key-value store: localStorage in browser, in-memory in Node (tests, SSR). */

const mem = new Map<string, string>();

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function studioStorageGet(key: string): string | null {
  if (isBrowser()) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return mem.get(key) ?? null;
    }
  }
  return mem.get(key) ?? null;
}

export function studioStorageSet(key: string, value: string): void {
  if (isBrowser()) {
    try {
      window.localStorage.setItem(key, value);
      return;
    } catch {
      /* quota / private mode */
    }
  }
  mem.set(key, value);
}

export function studioStorageRemove(key: string): void {
  if (isBrowser()) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
  mem.delete(key);
}

/** Tests: clear a single logical store key. */
export function resetStudioStorageKey(key: string): void {
  mem.delete(key);
  if (isBrowser()) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
}
