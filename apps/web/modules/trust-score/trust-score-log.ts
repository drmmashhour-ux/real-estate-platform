export function logTrustScore(message: string, meta?: Record<string, unknown>): void {
  if (meta && Object.keys(meta).length > 0) console.info("[trust-score]", message, meta);
  else console.info("[trust-score]", message);
}

export function logTrustRanking(message: string, meta?: Record<string, unknown>): void {
  if (meta && Object.keys(meta).length > 0) console.info("[ranking]", message, meta);
  else console.info("[ranking]", message);
}

export function logTrustDelta(message: string, meta?: Record<string, unknown>): void {
  if (meta && Object.keys(meta).length > 0) console.info("[trust-delta]", message, meta);
  else console.info("[trust-delta]", message);
}
