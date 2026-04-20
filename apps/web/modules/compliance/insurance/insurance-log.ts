type LogPayload = Record<string, unknown> | undefined;

export function logInsurance(message: string, meta?: LogPayload): void {
  if (meta && Object.keys(meta).length > 0) {
    console.log(`[insurance] ${message}`, meta);
  } else {
    console.log(`[insurance] ${message}`);
  }
}

export function logCompliance(message: string, meta?: LogPayload): void {
  if (meta && Object.keys(meta).length > 0) {
    console.log(`[compliance] ${message}`, meta);
  } else {
    console.log(`[compliance] ${message}`);
  }
}

export function logClaim(message: string, meta?: LogPayload): void {
  if (meta && Object.keys(meta).length > 0) {
    console.log(`[claim] ${message}`, meta);
  } else {
    console.log(`[claim] ${message}`);
  }
}
