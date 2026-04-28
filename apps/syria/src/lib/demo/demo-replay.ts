import type { DemoRecordedEvent } from "@/lib/demo/demo-recorder";

export type ReplayDeps = {
  /** Navigate client-side only — caller must pass locale-prefixed paths from recordings */
  navigate: (path: string) => void | Promise<void>;
  /** Visual-only pulse / toast — never triggers DOM click dispatch */
  onUiPulse?: (hint: string) => void;
  /** Pause between steps (navigation / pulse only — no writes). */
  stepDelayMs?: number;
  signal?: AbortSignal;
};

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error("aborted"));
      return;
    }
    const id = setTimeout(() => resolve(), ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(id);
        reject(new Error("aborted"));
      },
      { once: true },
    );
  });
}

/**
 * Replays a recorded investor-demo session using navigation + UI pulses only.
 * Does not programmatically click elements or call mutation APIs.
 */
export async function replayDemoSession(events: DemoRecordedEvent[], deps: ReplayDeps): Promise<void> {
  const sorted = [...events].sort((a, b) => a.timestamp - b.timestamp);
  const delay = deps.stepDelayMs ?? 700;

  for (const ev of sorted) {
    if (deps.signal?.aborted) break;
    try {
      await sleep(delay, deps.signal);
    } catch {
      break;
    }
    if (deps.signal?.aborted) break;

    if (ev.type === "NAVIGATION") {
      await deps.navigate(ev.path);
      continue;
    }

    const hint =
      (typeof ev.metadata?.demoKind === "string" && ev.metadata.demoKind) ||
      (typeof ev.metadata?.hint === "string" && ev.metadata.hint) ||
      "click";
    deps.onUiPulse?.(String(hint));
  }
}
