/**
 * Scripted investor demo timing — helpers for paced navigation (client-only; no APIs).
 */

export const DWELL_MS_MIN = 5_000;
export const DWELL_MS_MAX = 8_000;

/** Random dwell in [DWELL_MS_MIN, DWELL_MS_MAX] inclusive (5–8s). */
export function dwellMs(): number {
  const span = Math.max(1, DWELL_MS_MAX - DWELL_MS_MIN);
  return DWELL_MS_MIN + Math.floor(Math.random() * (span + 1));
}

/** Promise-based timer; rejects with AbortError when `signal` aborts (browser only). */
export function delay(ms: number, signal?: AbortSignal): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const t = window.setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);

    function onAbort() {
      window.clearTimeout(t);
      reject(new DOMException("Aborted", "AbortError"));
    }

    signal?.addEventListener("abort", onAbort);
  });
}

export type RunInvestorDemoOptions = {
  signal: AbortSignal;
  totalSteps: number;

  /** Invoked each step before dwell wait (typically navigate + overlay update). */
  onStepBegin: (index: number, msForStep: number, total: number) => void;
  afterDwell?: (index: number) => void;
};

/**
 * Pace through scripted steps: invoke `onStepBegin`, await dwellMs(), repeat.
 * Use with `AbortController` to Pause/Stop cleanly.
 */
export async function runInvestorDemo(opts: RunInvestorDemoOptions): Promise<number> {
  let completed = 0;
  for (let i = 0; i < opts.totalSteps; i++) {
    opts.signal.throwIfAborted();
    const ms = dwellMs();
    opts.onStepBegin(i, ms, opts.totalSteps);
    await delay(ms, opts.signal);
    opts.afterDwell?.(i);
    completed = i + 1;
  }

  return completed;
}
