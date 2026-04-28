"use client";

import type { NarrationLang } from "@/lib/demo/narration-registry";
import type { DemoScriptStep } from "@/lib/demo/demo-script";
import {
  cancelActiveNarrationPlayback,
  narrationLocaleFromPathname,
  registerNarrationLocale,
  setAutoDemoScriptPlayback,
  setSuppressAutomaticRouteNarration,
  triggerNarration,
} from "@/lib/demo/narrator";

export type RunDemoScriptOptions = {
  steps: DemoScriptStep[];
  /** Locale-aware navigation (e.g. next-intl `useRouter().push`). */
  navigate: (path: string) => void;
  signal?: AbortSignal;
};

export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const onAbort = () => {
      clearTimeout(id);
      signal?.removeEventListener("abort", onAbort);
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal?.addEventListener("abort", onAbort);
    const id = window.setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
  });
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
}

/**
 * Client-only tour: `router.push` + deterministic narration. No API or DB calls here.
 */
export async function runDemoScript(opts: RunDemoScriptOptions): Promise<void> {
  const { steps, navigate, signal } = opts;

  setAutoDemoScriptPlayback(true);
  setSuppressAutomaticRouteNarration(true);
  let localeCursor: NarrationLang = narrationLocaleFromPathname(
    typeof window !== "undefined" ? window.location.pathname : "/",
  );

  try {
    for (const step of steps) {
      throwIfAborted(signal);

      switch (step.type) {
        case "NAVIGATE": {
          navigate(step.path);
          localeCursor = narrationLocaleFromPathname(step.path);
          registerNarrationLocale(localeCursor);
          triggerNarration(step.narration, localeCursor);
          break;
        }
        case "ACTION": {
          registerNarrationLocale(localeCursor);
          triggerNarration(step.key, localeCursor);
          break;
        }
        case "WAIT": {
          await sleep(step.ms, signal);
          break;
        }
      }
    }
  } finally {
    setAutoDemoScriptPlayback(false);
    setSuppressAutomaticRouteNarration(false);
    try {
      if (typeof window !== "undefined") cancelActiveNarrationPlayback();
    } catch {
      /* ignore */
    }
  }
}

export function isAbortError(e: unknown): boolean {
  return e instanceof DOMException && e.name === "AbortError";
}
