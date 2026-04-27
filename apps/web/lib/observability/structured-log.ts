/**
 * Consistent console tags for grep-friendly logs: [AI] [DB] [API] [FRAUD].
 */

export function logAi(message: string, meta?: Record<string, unknown>): void {
  if (meta && Object.keys(meta).length) console.log("[AI]", message, meta);
  else console.log("[AI]", message);
}

export function logAiError(message: string, err: unknown, meta?: Record<string, unknown>): void {
  console.error("[AI ERROR]", message, meta && Object.keys(meta).length ? meta : undefined, err);
}

export function logDb(message: string, meta?: Record<string, unknown>): void {
  if (meta && Object.keys(meta).length) console.log("[DB]", message, meta);
  else console.log("[DB]", message);
}

export function logDbError(message: string, err: unknown, meta?: Record<string, unknown>): void {
  console.error("[DB ERROR]", message, meta && Object.keys(meta).length ? meta : undefined, err);
}

export function logApi(message: string, meta?: Record<string, unknown>): void {
  if (meta && Object.keys(meta).length) console.log("[API]", message, meta);
  else console.log("[API]", message);
}

export function logFraud(message: string, meta?: Record<string, unknown>): void {
  if (meta && Object.keys(meta).length) console.log("[FRAUD]", message, meta);
  else console.log("[FRAUD]", message);
}
