/**
 * Lightweight conversion funnel signals for /get-leads — in-memory + localStorage.
 * No external analytics.
 */

const PREFIX = "growth:conv:";
const KEYS = {
  landingView: `${PREFIX}landing_view`,
  formStart: `${PREFIX}form_start`,
  formSubmit: `${PREFIX}form_submit`,
} as const;

type Counters = {
  landingViews: number;
  formStarts: number;
  formSubmits: number;
};

const memory: Counters = { landingViews: 0, formStarts: 0, formSubmits: 0 };

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function bumpMemory(key: keyof Counters): void {
  memory[key] += 1;
}

function readLsInt(key: string): number {
  if (!canUseStorage()) return 0;
  try {
    const v = window.localStorage.getItem(key);
    const n = v ? parseInt(v, 10) : 0;
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

function writeLsInt(key: string, n: number): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(key, String(n));
  } catch {
    /* ignore quota */
  }
}

function bumpLs(key: string, field: keyof Counters): void {
  const next = readLsInt(key) + 1;
  writeLsInt(key, next);
  bumpMemory(field);
}

/** First paint / route entry for the landing. */
export function recordLandingView(): void {
  bumpLs(KEYS.landingView, "landingViews");
}

/** First interaction with any lead form field. */
export function recordFormStart(): void {
  bumpLs(KEYS.formStart, "formStarts");
}

/** Successful form submission (client-side ack). */
export function recordFormSubmit(): void {
  bumpLs(KEYS.formSubmit, "formSubmits");
}

/** Optional: read for debugging / future UI (not sent to server by default). */
export function getConversionSnapshot(): Counters {
  if (canUseStorage()) {
    return {
      landingViews: readLsInt(KEYS.landingView),
      formStarts: readLsInt(KEYS.formStart),
      formSubmits: readLsInt(KEYS.formSubmit),
    };
  }
  return { ...memory };
}
