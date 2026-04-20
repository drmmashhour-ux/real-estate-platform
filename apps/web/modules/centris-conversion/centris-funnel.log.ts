type Meta = Record<string, unknown> | undefined;

export function logLead(scope: string, meta?: Meta): void {
  if (meta && Object.keys(meta).length) console.log(`[lead] ${scope}`, meta);
  else console.log(`[lead] ${scope}`);
}

export function logFunnel(scope: string, meta?: Meta): void {
  if (meta && Object.keys(meta).length) console.log(`[funnel] ${scope}`, meta);
  else console.log(`[funnel] ${scope}`);
}

export function logConversion(scope: string, meta?: Meta): void {
  if (meta && Object.keys(meta).length) console.log(`[conversion] ${scope}`, meta);
  else console.log(`[conversion] ${scope}`);
}
