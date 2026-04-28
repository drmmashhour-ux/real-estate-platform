/** Stable key for snapshotting browse API responses. */
export function normalizeSearchQueryString(qs: string): string {
  const sp = new URLSearchParams(qs);
  const pairs = [...sp.entries()].sort((a, b) => {
    const c = a[0].localeCompare(b[0]);
    return c !== 0 ? c : a[1].localeCompare(b[1]);
  });
  const next = new URLSearchParams();
  for (const [k, v] of pairs) {
    next.append(k, v);
  }
  return next.toString();
}

export function searchApiSnapshotKey(surface: string, normalizedQs: string): string {
  return `GET:/api/search?surface=${encodeURIComponent(surface)}&${normalizedQs}`;
}
