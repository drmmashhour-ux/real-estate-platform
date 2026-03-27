"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getDemoSteps, resolveDemoRoute, type DemoStep, type TourId, isTourId } from "@/lib/demo/demo-steps";
import { DemoEvents } from "@/lib/demo-event-types";
import { trackDemoClient } from "@/lib/demo-track-client";
import { isDemoTourRuntimeEnabled } from "@/lib/demo/demo-env";

const LS_ACTIVE = "demo_mode_active";
const LS_STEP = "demo_current_step";
const LS_TOUR = "lecipm_demo_tour_id";
const LS_PENDING_AUTOSTART = "lecipm_demo_pending_autostart";
const LS_AUTOSTART_DONE = "lecipm_demo_autostart_done";
const LS_DISMISS = "lecipm_demo_dismiss_session";

const DEFAULT_TOUR: TourId = "standard_user_tour";

export type DemoContextValue = {
  isActive: boolean;
  currentStepIndex: number;
  totalSteps: number;
  currentStepId: string | null;
  tourId: TourId;
  steps: DemoStep[];
  startDemo: (tourId?: TourId, source?: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  skipDemo: () => void;
  endDemo: () => void;
  dismissForSession: () => void;
};

const DemoContext = createContext<DemoContextValue | null>(null);

export function useDemo(): DemoContextValue {
  const ctx = useContext(DemoContext);
  if (!ctx) {
    throw new Error("useDemo must be used within DemoProvider");
  }
  return ctx;
}

function persist(stepIndex: number, active: boolean, tour: TourId) {
  try {
    if (active) {
      localStorage.setItem(LS_ACTIVE, "1");
      localStorage.setItem(LS_STEP, String(stepIndex));
      localStorage.setItem(LS_TOUR, tour);
    } else {
      localStorage.removeItem(LS_ACTIVE);
      localStorage.removeItem(LS_STEP);
    }
  } catch {
    /* ignore */
  }
}

function navigateToIndex(router: ReturnType<typeof useRouter>, pathname: string, index: number, tid: TourId) {
  const list = getDemoSteps(tid);
  const step = list[index];
  if (!step) return;
  const path = resolveDemoRoute(step.route);
  if (pathname !== path) router.push(path);
}

export function DemoProviderInner({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [tourId, setTourId] = useState<TourId>(DEFAULT_TOUR);
  const autostartRan = useRef(false);

  const steps = useMemo(() => getDemoSteps(tourId), [tourId]);

  const track = useCallback((event: (typeof DemoEvents)[keyof typeof DemoEvents], meta?: Record<string, unknown>) => {
    trackDemoClient(event, meta);
  }, []);

  const endDemoInternal = useCallback(
    (reason: "complete" | "skip") => {
      if (process.env.NEXT_PUBLIC_ENV !== "staging" && process.env.NEXT_PUBLIC_DEMO_TOUR !== "1") return;
      setIsActive(false);
      setCurrentStepIndex(0);
      persist(0, false, tourId);
      if (reason === "complete") {
        track(DemoEvents.DEMO_COMPLETED, { tourId });
      } else {
        track(DemoEvents.DEMO_SKIPPED, { tourId });
      }
    },
    [tourId, track]
  );

  const startDemo = useCallback(
    (nextTour: TourId = DEFAULT_TOUR, source = "manual") => {
      if (process.env.NEXT_PUBLIC_ENV !== "staging" && process.env.NEXT_PUBLIC_DEMO_TOUR !== "1") return;
      setTourId(nextTour);
      setIsActive(true);
      setCurrentStepIndex(0);
      persist(0, true, nextTour);
      track(DemoEvents.DEMO_STARTED, { tourId: nextTour, source });
      const first = getDemoSteps(nextTour)[0];
      if (first) {
        track(DemoEvents.DEMO_STEP_VIEWED, { stepId: first.id, tourId: nextTour, source });
        navigateToIndex(router, pathname, 0, nextTour);
      }
    },
    [pathname, router, track]
  );

  const endDemo = useCallback(() => {
    endDemoInternal("complete");
  }, [endDemoInternal]);

  const skipDemo = useCallback(() => {
    endDemoInternal("skip");
  }, [endDemoInternal]);

  const dismissForSession = useCallback(() => {
    try {
      sessionStorage.setItem(LS_DISMISS, "1");
    } catch {
      /* ignore */
    }
    setIsActive(false);
    persist(0, false, tourId);
  }, [tourId]);

  const nextStep = useCallback(() => {
    setCurrentStepIndex((i) => {
      const list = getDemoSteps(tourId);
      const next = i + 1;
      if (next >= list.length) {
        queueMicrotask(() => endDemoInternal("complete"));
        return i;
      }
      persist(next, true, tourId);
      const step = list[next];
      if (step) {
        track(DemoEvents.DEMO_STEP_VIEWED, { stepId: step.id, tourId });
        navigateToIndex(router, pathname, next, tourId);
      }
      return next;
    });
  }, [tourId, pathname, router, track, endDemoInternal]);

  const prevStep = useCallback(() => {
    setCurrentStepIndex((i) => {
      if (i <= 0) return i;
      const prev = i - 1;
      persist(prev, true, tourId);
      const list = getDemoSteps(tourId);
      const step = list[prev];
      if (step) {
        track(DemoEvents.DEMO_STEP_VIEWED, { stepId: step.id, tourId });
        navigateToIndex(router, pathname, prev, tourId);
      }
      return prev;
    });
  }, [tourId, pathname, router, track]);

  useEffect(() => {
    const raw = searchParams.get("demoTour");
    if (raw === "investor") {
      try {
        localStorage.setItem(LS_TOUR, "investor_tour");
      } catch {
        /* ignore */
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_ENV !== "staging" && process.env.NEXT_PUBLIC_DEMO_TOUR !== "1") return;
    if (autostartRan.current) return;
    autostartRan.current = true;
    try {
      let dismissed = false;
      try {
        dismissed = sessionStorage.getItem(LS_DISMISS) === "1";
      } catch {
        /* ignore */
      }
      if (dismissed) return;

      const storedTour = localStorage.getItem(LS_TOUR);
      const tid: TourId = isTourId(storedTour) ? storedTour : DEFAULT_TOUR;
      setTourId(tid);

      const active = localStorage.getItem(LS_ACTIVE) === "1";
      const rawStep = localStorage.getItem(LS_STEP);
      const idx = rawStep != null ? parseInt(rawStep, 10) : 0;
      const list = getDemoSteps(tid);
      if (active && !Number.isNaN(idx) && idx >= 0 && idx < list.length) {
        setIsActive(true);
        setCurrentStepIndex(idx);
        return;
      }
      const pending = localStorage.getItem(LS_PENDING_AUTOSTART);
      const done = localStorage.getItem(LS_AUTOSTART_DONE);
      if (pending === "1" && !done) {
        localStorage.setItem(LS_AUTOSTART_DONE, "1");
        localStorage.removeItem(LS_PENDING_AUTOSTART);
        setTourId(tid);
        setIsActive(true);
        setCurrentStepIndex(0);
        persist(0, true, tid);
        track(DemoEvents.DEMO_STARTED, { tourId: tid, source: "pending_autostart" });
        navigateToIndex(router, pathname, 0, tid);
      }
    } catch {
      /* ignore */
    }
  }, [pathname, router, track]);

  const value = useMemo<DemoContextValue>(
    () => ({
      isActive,
      currentStepIndex,
      totalSteps: steps.length,
      currentStepId: steps[currentStepIndex]?.id ?? null,
      tourId,
      steps,
      startDemo,
      nextStep,
      prevStep,
      skipDemo,
      endDemo,
      dismissForSession,
    }),
    [
      isActive,
      currentStepIndex,
      steps,
      tourId,
      startDemo,
      nextStep,
      prevStep,
      skipDemo,
      endDemo,
      dismissForSession,
    ]
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}
