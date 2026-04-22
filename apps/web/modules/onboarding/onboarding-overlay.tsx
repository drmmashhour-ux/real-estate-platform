"use client";

import type { RefObject } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { LecipmShellRole } from "@/config/navigation.config";

import {
  getOnboardingSteps,
  persistOnboardingCompleted,
  readOnboardingCompleted,
  type OnboardingStepDef,
} from "@/modules/onboarding/onboarding.service";

type Rect = { top: number; left: number; width: number; height: number };

function measure(element: Element | null): Rect | null {
  if (!element || !(element instanceof HTMLElement)) return null;
  const r = element.getBoundingClientRect();
  return {
    top: r.top + window.scrollY,
    left: r.left + window.scrollX,
    width: r.width,
    height: r.height,
  };
}

/** Fixed-position rect for spotlight (viewport coordinates). */
function viewportRect(el: HTMLElement | null): DOMRect | null {
  if (!el) return null;
  return el.getBoundingClientRect();
}

export function OnboardingTourOverlay(props: {
  shellRole: LecipmShellRole;
  /** Delay first paint until layout stable */
  disabled?: boolean;
}) {
  const steps = useMemo(() => getOnboardingSteps(props.shellRole), [props.shellRole]);
  const [stepIndex, setStepIndex] = useState(0);
  const [hole, setHole] = useState<DOMRect | null>(null);
  const [visible, setVisible] = useState(false);
  const rafRef = useRef<number | undefined>(undefined);

  const refreshHole = useCallback(() => {
    const step = steps[stepIndex];
    if (!step) return;
    const el = document.querySelector(step.targetSelector);
    const rect = viewportRect(el as HTMLElement | null);
    setHole(rect && rect.width > 0 && rect.height > 0 ? rect : null);
  }, [steps, stepIndex]);

  useEffect(() => {
    if (props.disabled || steps.length === 0) return;
    queueMicrotask(() => {
      if (readOnboardingCompleted()) return;
      setVisible(true);
    });
  }, [props.disabled, steps.length]);

  useEffect(() => {
    if (!visible || steps.length === 0) return;
    refreshHole();

    const onResize = () => {
      window.cancelAnimationFrame(rafRef.current ?? 0);
      rafRef.current = window.requestAnimationFrame(refreshHole);
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
      window.cancelAnimationFrame(rafRef.current ?? 0);
    };
  }, [visible, steps.length, refreshHole]);

  useEffect(() => {
    refreshHole();
  }, [stepIndex, refreshHole]);

  const finish = useCallback(() => {
    persistOnboardingCompleted(true);
    setVisible(false);
  }, []);

  const next = useCallback(() => {
    if (stepIndex >= steps.length - 1) {
      finish();
      return;
    }
    let nextIdx = stepIndex + 1;
    while (nextIdx < steps.length) {
      const sel = steps[nextIdx]!.targetSelector;
      const el = document.querySelector(sel);
      const r = viewportRect(el as HTMLElement | null);
      if (r && r.width > 0 && r.height > 0) break;
      nextIdx += 1;
    }
    if (nextIdx >= steps.length) {
      finish();
      return;
    }
    setStepIndex(nextIdx);
  }, [stepIndex, steps, finish]);

  const skip = useCallback(() => {
    finish();
  }, [finish]);

  if (!visible || steps.length === 0) return null;

  const step: OnboardingStepDef | undefined = steps[stepIndex];
  if (!step) return null;

  const pad = 8;
  const tooltipLeft = hole ? Math.min(Math.max(hole.left + hole.width / 2 - 140, 16), window.innerWidth - 300) : 24;
  const tooltipTop = hole ? hole.bottom + 12 + pad : 120;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none" aria-live="polite">
      {/* Dim overlay — split so hole stays clickable for visual only; full-screen pointer-events auto on footer */}
      <div className="pointer-events-none absolute inset-0 bg-black/75 backdrop-blur-[2px]" />

      {hole ?
        <>
          <div
            className="pointer-events-none absolute rounded-xl border-4 border-[#D4AF37] shadow-[0_0_0_9999px_rgba(0,0,0,0.82)] transition-all duration-300 ease-out"
            style={{
              top: hole.top - pad,
              left: hole.left - pad,
              width: hole.width + pad * 2,
              height: hole.height + pad * 2,
            }}
          />
        </>
      : null}

      <div
        className="pointer-events-auto absolute max-w-[min(22rem,calc(100vw-2rem))] rounded-xl bg-black px-4 py-3 text-white shadow-2xl ring-1 ring-white/10 transition-opacity duration-300 ease-out animate-in fade-in zoom-in-95"
        style={{ left: tooltipLeft, top: Math.min(tooltipTop, window.innerHeight - 220) }}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">Guide</p>
        <p className="mt-2 text-base font-semibold">{step.title}</p>
        <p className="mt-2 text-sm leading-relaxed text-zinc-300">{step.body}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-black shadow-md transition hover:brightness-110 active:scale-[0.98]"
            onClick={next}
          >
            {stepIndex >= steps.length - 1 ? "Done" : "Next"}
          </button>
          <button
            type="button"
            className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/10 active:scale-[0.98]"
            onClick={skip}
          >
            Skip
          </button>
        </div>
        <p className="mt-3 text-[10px] text-zinc-500">
          Step {stepIndex + 1} of {steps.length}
        </p>
      </div>
    </div>
  );
}

/** Fade-in wrapper for main content — reduces flash on route transitions. */
export function PageTransitionShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    queueMicrotask(() => setEntered(true));
  }, []);

  return (
    <div
      className={`motion-safe:transition-opacity motion-safe:duration-300 motion-safe:ease-out ${entered ? "opacity-100" : "opacity-0"}`}
    >
      {children}
    </div>
  );
}
