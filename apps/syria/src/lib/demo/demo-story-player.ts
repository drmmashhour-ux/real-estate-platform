"use client";

import type { NarrationLang } from "@/lib/demo/narration-registry";
import {
  demoStory,
  demoStoryTotalMs,
  type DemoStoryScene,
} from "@/lib/demo/demo-story";
import {
  cancelActiveNarrationPlayback,
  registerNarrationLocale,
  setStoryModePlayback,
  setSuppressAutomaticRouteNarration,
  triggerNarration,
} from "@/lib/demo/narrator";
import { routing } from "@/i18n/routing";

export type StoryPlaybackControllers = {
  isPaused: () => boolean;
  /** Resolves when pause ends (call when toggling pause off). */
  consumeResumeWait: () => Promise<void>;
  shouldSkipScene: () => boolean;
  clearSkipScene: () => void;
};

export type RunStoryModeOptions = {
  scenes?: DemoStoryScene[];
  navigate: (path: string) => void;
  /** Current UI locale for narration (updated after each navigate). */
  getLocale: () => NarrationLang;
  signal?: AbortSignal;
  controllers?: StoryPlaybackControllers;
  onSceneStart?: (payload: {
    scene: DemoStoryScene;
    index: number;
    total: number;
    cumulativeMsBeforeScene: number;
  }) => void;
  onSceneTick?: (payload: {
    scene: DemoStoryScene;
    index: number;
    total: number;
    elapsedInScene: number;
    cumulativeMs: number;
  }) => void;
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

/** Builds a locale-prefixed path for next-intl navigation (`/en/demo`, `/ar/listing/...`). */
export function localePathForStory(navigate: string, locale: NarrationLang): string {
  const raw = navigate.startsWith("/") ? navigate : `/${navigate}`;
  for (const loc of routing.locales) {
    const prefix = `/${loc}`;
    if (raw === prefix || raw.startsWith(`${prefix}/`)) {
      const rest = raw === prefix ? "/" : raw.slice(prefix.length);
      const suffix = rest === "/" ? "" : rest;
      return `/${locale}${suffix}`;
    }
  }
  return `/${locale}${raw === "/" ? "" : raw}`;
}

function applyStoryDom(active: boolean, highlight?: DemoStoryScene["highlight"]): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (active) {
    root.dataset.storyMode = "active";
    if (highlight) root.dataset.storyHighlight = highlight;
    else delete root.dataset.storyHighlight;
  } else {
    delete root.dataset.storyMode;
    delete root.dataset.storyHighlight;
  }
}

async function sleepStoryScene(
  ms: number,
  signal: AbortSignal | undefined,
  controllers: StoryPlaybackControllers | undefined,
  onTick: ((elapsed: number) => void) | undefined,
): Promise<void> {
  const ctrl = controllers;
  let elapsed = 0;
  while (elapsed < ms) {
    throwIfAborted(signal);
    if (ctrl?.shouldSkipScene()) return;

    while (ctrl?.isPaused()) {
      await ctrl.consumeResumeWait();
      throwIfAborted(signal);
    }

    const chunk = Math.min(200, ms - elapsed);
    await sleep(chunk, signal);
    elapsed += chunk;
    onTick?.(Math.min(elapsed, ms));
  }
}

/**
 * Pitch-deck mode: `router.push` + narration keys + optional UI highlights. No API or DB calls.
 */
export async function runStoryMode(opts: RunStoryModeOptions): Promise<void> {
  const {
    scenes = demoStory,
    navigate,
    getLocale,
    signal,
    controllers,
    onSceneStart,
    onSceneTick,
  } = opts;

  setStoryModePlayback(true);
  setSuppressAutomaticRouteNarration(true);

  let cumulativeBefore = 0;

  try {
    for (let index = 0; index < scenes.length; index++) {
      throwIfAborted(signal);
      const scene = scenes[index];

      if (scene.navigate) {
        const loc = getLocale();
        navigate(localePathForStory(scene.navigate, loc));
        registerNarrationLocale(loc);
        await sleep(320, signal);
      }

      const locale = getLocale();
      registerNarrationLocale(locale);

      applyStoryDom(true, scene.highlight);

      onSceneStart?.({
        scene,
        index,
        total: scenes.length,
        cumulativeMsBeforeScene: cumulativeBefore,
      });

      triggerNarration(scene.narrationKey, locale);

      await sleepStoryScene(scene.duration, signal, controllers, (elapsedInScene) => {
        const cumulativeMs = cumulativeBefore + elapsedInScene;
        onSceneTick?.({
          scene,
          index,
          total: scenes.length,
          elapsedInScene,
          cumulativeMs,
        });
      });

      cumulativeBefore += scene.duration;

      if (controllers?.shouldSkipScene()) {
        controllers.clearSkipScene();
      }
    }
  } finally {
    applyStoryDom(false);
    setStoryModePlayback(false);
    setSuppressAutomaticRouteNarration(false);
    try {
      if (typeof window !== "undefined") cancelActiveNarrationPlayback();
    } catch {
      /* ignore */
    }
  }
}

export function cumulativeProgress01(cumulativeMs: number): number {
  if (demoStoryTotalMs <= 0) return 0;
  return Math.min(1, Math.max(0, cumulativeMs / demoStoryTotalMs));
}

export function isAbortError(e: unknown): boolean {
  return e instanceof DOMException && e.name === "AbortError";
}
