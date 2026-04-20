/** Structured prefixes for observability — never log proprietary MLS payloads. */

export function centrisLog(message: string, meta?: Record<string, unknown>) {
  const suffix = meta && Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  console.info(`[centris] ${message}${suffix}`);
}

export function distributionLog(message: string, meta?: Record<string, unknown>) {
  const suffix = meta && Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  console.info(`[distribution] ${message}${suffix}`);
}
