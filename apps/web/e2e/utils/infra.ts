export function isInfraConnectionError(message: string): boolean {
  return /ECONNREFUSED|ERR_CONNECTION_REFUSED|net::ERR_CONNECTION|connect ECONNREFUSED/i.test(message);
}

export function statusForThrown(e: unknown): { status: "FAIL" | "BLOCKED"; msg: string } {
  const msg = e instanceof Error ? e.message : String(e);
  return { status: isInfraConnectionError(msg) ? "BLOCKED" : "FAIL", msg };
}
