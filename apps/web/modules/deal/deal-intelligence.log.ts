type Meta = Record<string, unknown> | undefined;

/** Structured logs for deal intelligence (deterministic scoring — not ML). */
export function logDealIntel(scope: string, meta?: Meta): void {
  if (meta && Object.keys(meta).length > 0) console.log(`[deal] ${scope}`, meta);
  else console.log(`[deal] ${scope}`);
}

export function logDealFunnel(scope: string, meta?: Meta): void {
  if (meta && Object.keys(meta).length > 0) console.log(`[funnel] ${scope}`, meta);
  else console.log(`[funnel] ${scope}`);
}

export function logDealConversion(scope: string, meta?: Meta): void {
  if (meta && Object.keys(meta).length > 0) console.log(`[conversion] ${scope}`, meta);
  else console.log(`[conversion] ${scope}`);
}
