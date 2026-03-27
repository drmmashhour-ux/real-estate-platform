export function clamp100(v: number) {
  return Math.max(0, Math.min(100, Math.round(v)));
}

export function weightedScore(parts: Array<{ value: number; weight: number }>) {
  const total = parts.reduce((acc, p) => acc + p.weight, 0);
  if (total <= 0) return 0;
  const raw = parts.reduce((acc, p) => acc + p.value * p.weight, 0) / total;
  return clamp100(raw);
}

export function normalizeNullable(v: number | null | undefined, fallback = 0) {
  return clamp100(v ?? fallback);
}

export function sortByScoreDesc<T extends { score: number }>(rows: T[]) {
  return [...rows].sort((a, b) => b.score - a.score);
}
