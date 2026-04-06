type Bucket = { failures: number; openedUntil: number };

const domains = new Map<string, Bucket>();

export function circuitAllow(domain: string, threshold = 5, coolDownMs = 60_000): boolean {
  const b = domains.get(domain) ?? { failures: 0, openedUntil: 0 };
  if (Date.now() < b.openedUntil) return false;
  return true;
}

export function circuitRecordFailure(domain: string, threshold = 5, coolDownMs = 60_000) {
  const b = domains.get(domain) ?? { failures: 0, openedUntil: 0 };
  b.failures += 1;
  if (b.failures >= threshold) {
    b.openedUntil = Date.now() + coolDownMs;
    b.failures = 0;
  }
  domains.set(domain, b);
}

export function circuitRecordSuccess(domain: string) {
  domains.delete(domain);
}
