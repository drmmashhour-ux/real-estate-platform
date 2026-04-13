/**
 * Reduce repetitive top results (same host / area / type) without hard-blocking inventory.
 */

export function diversifyByHost<T extends { id: string }>(
  rows: T[],
  getOwnerId: (row: T) => string | undefined | null,
  options?: { maxPerHostInPrefix?: number; prefixLength?: number }
): T[] {
  const maxPerHost = Math.max(1, options?.maxPerHostInPrefix ?? 2);
  const prefixLen = Math.max(1, options?.prefixLength ?? 24);
  if (rows.length <= 2) return rows;

  const byOwner = new Map<string, T[]>();
  for (const r of rows) {
    const k = getOwnerId(r) ?? "__none__";
    if (!byOwner.has(k)) byOwner.set(k, []);
    byOwner.get(k)!.push(r);
  }
  const owners = [...byOwner.keys()];
  const out: T[] = [];
  const takenPerOwner = new Map<string, number>();

  while (out.length < prefixLen && out.length < rows.length) {
    let progressed = false;
    for (const o of owners) {
      const list = byOwner.get(o)!;
      const n = takenPerOwner.get(o) ?? 0;
      if (n >= maxPerHost) continue;
      const next = list.shift();
      if (!next) continue;
      out.push(next);
      takenPerOwner.set(o, n + 1);
      progressed = true;
      if (out.length >= prefixLen) break;
    }
    if (!progressed) break;
  }

  const seen = new Set(out.map((x) => x.id));
  for (const r of rows) {
    if (!seen.has(r.id)) out.push(r);
  }
  return out;
}

export function diversifyByAreaAndType<T extends { id: string }>(
  rows: T[],
  getBucket: (row: T) => string,
  options?: { maxPerBucketInPrefix?: number; prefixLength?: number }
): T[] {
  const maxPer = Math.max(1, options?.maxPerBucketInPrefix ?? 3);
  const prefixLen = Math.max(1, options?.prefixLength ?? 20);
  if (rows.length <= 2) return rows;

  const byB = new Map<string, T[]>();
  for (const r of rows) {
    const k = getBucket(r);
    if (!byB.has(k)) byB.set(k, []);
    byB.get(k)!.push(r);
  }
  const keys = [...byB.keys()];
  const out: T[] = [];
  const counts = new Map<string, number>();

  while (out.length < prefixLen && out.length < rows.length) {
    let progressed = false;
    for (const k of keys) {
      const list = byB.get(k)!;
      const n = counts.get(k) ?? 0;
      if (n >= maxPer) continue;
      const next = list.shift();
      if (!next) continue;
      out.push(next);
      counts.set(k, n + 1);
      progressed = true;
      if (out.length >= prefixLen) break;
    }
    if (!progressed) break;
  }

  const seen = new Set(out.map((x) => x.id));
  for (const r of rows) {
    if (!seen.has(r.id)) out.push(r);
  }
  return out;
}
