const mem = new Map<string, string>();

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function autoVideoStoreGet(key: string): string | null {
  if (isBrowser()) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return mem.get(key) ?? null;
    }
  }
  return mem.get(key) ?? null;
}

export function autoVideoStoreSet(key: string, value: string): void {
  if (isBrowser()) {
    try {
      window.localStorage.setItem(key, value);
      return;
    } catch {
      /* quota */
    }
  }
  mem.set(key, value);
}

export function resetAutoVideoStoreKey(key: string): void {
  mem.delete(key);
  if (isBrowser()) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
}
