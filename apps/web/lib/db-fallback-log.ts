export type DbFallbackLogEntry = {
  label: string;
  time: string;
  error?: string;
};

const fallbackLog: DbFallbackLogEntry[] = [];
const MAX_ENTRIES = 200;

export function logFallback(label: string, errorMessage?: string) {
  const entry: DbFallbackLogEntry = {
    label,
    time: new Date().toISOString(),
  };
  if (errorMessage) entry.error = errorMessage;
  fallbackLog.push(entry);
  while (fallbackLog.length > MAX_ENTRIES) {
    fallbackLog.shift();
  }
}

export function getFallbacks(): ReadonlyArray<DbFallbackLogEntry> {
  return fallbackLog;
}

export function clearFallbacks() {
  fallbackLog.length = 0;
}
