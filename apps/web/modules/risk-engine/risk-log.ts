/**
 * Structured audit-style logs for the pre-dispute engine (operators / support — not user-facing legal findings).
 */
export function logRisk(message: string, meta?: Record<string, unknown>): void {
  if (meta && Object.keys(meta).length > 0) {
    console.info("[risk]", message, meta);
  } else {
    console.info("[risk]", message);
  }
}

export function logPrevention(message: string, meta?: Record<string, unknown>): void {
  if (meta && Object.keys(meta).length > 0) {
    console.info("[prevention]", message, meta);
  } else {
    console.info("[prevention]", message);
  }
}
