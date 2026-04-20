/** Prefixed structured logging for compliance engine paths (never throws). */

export function legalEngineLog(message: string, meta?: Record<string, unknown>): void {
  const suffix = meta && Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
  console.info(`[legal:engine]${suffix}`, message);
}

export function legalAlertsLog(message: string, meta?: Record<string, unknown>): void {
  const suffix = meta && Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
  console.info(`[legal:alerts]${suffix}`, message);
}

export function legalAuditLog(message: string, meta?: Record<string, unknown>): void {
  const suffix = meta && Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
  console.info(`[legal:audit]${suffix}`, message);
}

export function legalFraudLog(message: string, meta?: Record<string, unknown>): void {
  const suffix = meta && Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
  console.info(`[legal:fraud]${suffix}`, message);
}
