export function logDisputeRisk(message: string, meta?: Record<string, unknown>): void {
  if (meta && Object.keys(meta).length > 0) console.info("[dispute-risk]", message, meta);
  else console.info("[dispute-risk]", message);
}

export function logDisputePrevention(message: string, meta?: Record<string, unknown>): void {
  if (meta && Object.keys(meta).length > 0) console.info("[prevention]", message, meta);
  else console.info("[prevention]", message);
}

export function logPatternLearning(message: string, meta?: Record<string, unknown>): void {
  if (meta && Object.keys(meta).length > 0) console.info("[pattern-learning]", message, meta);
  else console.info("[pattern-learning]", message);
}
