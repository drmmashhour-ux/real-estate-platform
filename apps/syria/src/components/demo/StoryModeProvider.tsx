"use client";

import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { DemoMetricsOverlay } from "@/components/demo/DemoMetricsOverlay";
import { DemoStoryOverlay } from "@/components/demo/DemoStoryOverlay";
import { DemoVideoRecordingBadge } from "@/components/demo/DemoVideoRecordingBadge";
import {
  StoryModeContext,
  type StoryOverlayModel,
} from "@/components/demo/story-mode-context";
import {
  cumulativeProgress01,
  isAbortError,
  runStoryMode,
} from "@/lib/demo/demo-story-player";
import type { NarrationLang } from "@/lib/demo/narration-registry";
import {
  cancelActiveNarrationPlayback,
  narrationLocaleFromPathname,
} from "@/lib/demo/narrator";
import { useAutoNarration } from "@/components/demo/NarrationProvider";

export type { StoryModeContextValue, StoryOverlayModel } from "@/components/demo/story-mode-context";
export { useStoryMode } from "@/components/demo/story-mode-context";

const INITIAL_OVERLAY: StoryOverlayModel = {
  visible: false,
  banner: "",
  title: "",
  subtitle: null,
  sceneLabel: "",
  progress01: 0,
};

export function StoryModeProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const narration = useAutoNarration();

  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);

  const skipRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const resumeWaiters = useRef<(() => void)[]>([]);

  const [overlay, setOverlay] = useState<StoryOverlayModel>(INITIAL_OVERLAY);

  const getLocale = useCallback((): NarrationLang => narrationLocaleFromPathname(pathname ?? ""), [pathname]);

  const controllers = useMemo(
    () => ({
      isPaused: () => pausedRef.current,
      consumeResumeWait: () =>
        new Promise<void>((resolve) => {
          if (!pausedRef.current) {
            resolve();
            return;
          }
          resumeWaiters.current.push(resolve);
        }),
      shouldSkipScene: () => skipRef.current,
      clearSkipScene: () => {
        skipRef.current = false;
      },
    }),
    [],
  );

  const togglePause = useCallback(() => {
    if (!running) return;
    const next = !pausedRef.current;
    pausedRef.current = next;
    setPaused(next);
    if (!next) {
      resumeWaiters.current.splice(0).forEach((fn) => fn());
    }
  }, [running]);

  const skipScene = useCallback(() => {
    skipRef.current = true;
  }, []);

  const stopStoryMode = useCallback(() => {
    abortRef.current?.abort();
    cancelActiveNarrationPlayback();
    pausedRef.current = false;
    setPaused(false);
    skipRef.current = false;
  }, []);

  const startStoryMode = useCallback(async (): Promise<"completed" | "aborted"> => {
    if (!narration?.investorDemoActive) return "aborted";

    abortRef.current?.abort();
    abortRef.current = new AbortController();
    pausedRef.current = false;
    setPaused(false);
    skipRef.current = false;

    setRunning(true);
    setOverlay({
      visible: true,
      banner: "🎬 Story Mode — Investor Presentation",
      title: "",
      subtitle: null,
      sceneLabel: "",
      progress01: 0,
    });

    let outcome: "completed" | "aborted" = "completed";
    try {
      await runStoryMode({
        navigate: (path) => {
          router.push(path);
        },
        getLocale,
        signal: abortRef.current.signal,
        controllers,
        onSceneStart: ({ scene, index, total, cumulativeMsBeforeScene }) => {
          setOverlay((prev) => ({
            ...prev,
            visible: true,
            banner: "🎬 Story Mode — Investor Presentation",
            title: scene.title,
            subtitle: scene.subtitle ?? null,
            sceneLabel: `${index + 1}/${total}`,
            progress01: cumulativeProgress01(cumulativeMsBeforeScene),
          }));
        },
        onSceneTick: ({ cumulativeMs }) => {
          setOverlay((prev) => ({
            ...prev,
            progress01: cumulativeProgress01(cumulativeMs),
          }));
        },
      });
    } catch (e) {
      if (isAbortError(e)) {
        outcome = "aborted";
      } else {
        console.error(e);
        outcome = "aborted";
      }
    } finally {
      setRunning(false);
      pausedRef.current = false;
      setPaused(false);
      skipRef.current = false;
      setOverlay(INITIAL_OVERLAY);
    }
    return outcome;
  }, [controllers, getLocale, narration?.investorDemoActive, router]);

  const value = useMemo(
    () => ({
      running,
      paused,
      overlay,
      startStoryMode,
      togglePause,
      skipScene,
      stopStoryMode,
    }),
    [running, paused, overlay, startStoryMode, togglePause, skipScene, stopStoryMode],
  );

  return (
    <StoryModeContext.Provider value={value}>
      {children}
      <DemoMetricsOverlay />
      <DemoVideoRecordingBadge />
      <DemoStoryOverlay
        visible={overlay.visible}
        banner={overlay.banner}
        title={overlay.title}
        subtitle={overlay.subtitle}
        sceneLabel={overlay.sceneLabel}
        progress01={overlay.progress01}
      />
    </StoryModeContext.Provider>
  );
}
