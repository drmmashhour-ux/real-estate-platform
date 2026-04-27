/**
 * Never log raw secrets. Use for DATABASE_URL, tokens, and passwords in diagnostic output.
 */
const PREFIX = {
  lecipm: "[LECIPM]",
  sybnb: "[SYBNB]",
  hadialink: "[HADIALINK]",
  demo: "[DEMO]",
} as const;

export type SafeLogPrefix = keyof typeof PREFIX;

function maskUserinfo(urlStr: string): string {
  const t = urlStr.trim();
  if (!t.startsWith("postgres")) return t.replace(/token=[^&\s]+/gi, "token=***");
  try {
    const u = new URL(t);
    if (u.username || u.password) {
      u.username = "***";
      u.password = "";
    }
    u.searchParams.forEach((v, k) => {
      if (/password|token|secret|key/i.test(k)) u.searchParams.set(k, "***");
    });
    return u.toString();
  } catch {
    return t.replace(/:[^@/][^@]*@/, ":***@");
  }
}

/** Safe string for logs / errors (not for connection). */
export function maskDatabaseUrl(url: string | undefined): string {
  if (!url?.trim()) return "(no DATABASE_URL)";
  return maskUserinfo(url);
}

export function formatSafeLogLine(scope: SafeLogPrefix, message: string): string {
  return `${PREFIX[scope]} ${message}`;
}

export function logSafeInfo(scope: SafeLogPrefix, message: string): void {
  console.info(formatSafeLogLine(scope, message));
}

export function logSafeWarn(scope: SafeLogPrefix, message: string): void {
  console.warn(formatSafeLogLine(scope, message));
}
