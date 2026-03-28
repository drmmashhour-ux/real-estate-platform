"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useDemo } from "@/components/demo/demo-context";
import { DemoProgressBar } from "@/components/demo/DemoProgressBar";

const GOLD = "var(--color-premium-gold)";

export function DemoOverlay() {
  const pathname = usePathname();
  const { isActive, currentStepIndex, totalSteps, steps, nextStep, prevStep, skipDemo } = useDemo();
  const step = steps[currentStepIndex];
  const [rect, setRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const [aiText, setAiText] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const updateHighlight = useCallback(() => {
    if (!isActive || !step?.highlight) {
      setRect(null);
      return;
    }
    const el = document.querySelector(step.highlight);
    if (!el || !(el instanceof HTMLElement)) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setRect({
      top: r.top,
      left: r.left,
      width: r.width,
      height: r.height,
    });
  }, [isActive, step?.highlight]);

  useEffect(() => {
    if (!isActive) {
      setRect(null);
      return;
    }
    updateHighlight();
    const t = window.setTimeout(updateHighlight, 400);
    const onScroll = () => updateHighlight();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => updateHighlight())
        : null;
    const el = step?.highlight ? document.querySelector(step.highlight) : null;
    if (el && ro) ro.observe(el);

    return () => {
      window.clearTimeout(t);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
      ro?.disconnect();
    };
  }, [isActive, pathname, step?.highlight, updateHighlight]);

  useEffect(() => {
    if (isActive && step?.highlight) {
      const el = document.querySelector(step.highlight);
      el?.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [isActive, currentStepIndex, step?.highlight]);

  const explainMore = useCallback(async () => {
    if (!step) return;
    setAiLoading(true);
    setAiText(null);
    try {
      const res = await fetch("/api/demo/ai-help", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stepId: step.id }),
      });
      const j = (await res.json()) as { explanation?: string };
      setAiText(typeof j.explanation === "string" ? j.explanation : "");
    } catch {
      setAiText("Could not load a tip right now.");
    } finally {
      setAiLoading(false);
    }
  }, [step]);

  if (!isActive || !step) return null;

  const n = currentStepIndex + 1;

  return (
    <div className="pointer-events-none fixed inset-0 z-[10040]" aria-live="polite">
      {/* Non-blocking dim — pointer-events none so users can still use the app */}
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px]" aria-hidden />

      {rect && step.highlight ? (
        <div
          className="pointer-events-none absolute rounded-lg ring-2 ring-premium-gold ring-offset-2 ring-offset-black/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          }}
        />
      ) : null}

      <div
        className="pointer-events-auto absolute left-1/2 w-[min(100vw-2rem,420px)] -translate-x-1/2 rounded-2xl border border-white/15 bg-[#121212]/95 p-4 text-white shadow-2xl"
        style={{
          bottom: 24,
          maxHeight: "min(52vh, 420px)",
        }}
      >
        <div className="mb-3 flex items-center justify-between gap-2 text-[10px] uppercase tracking-wider text-slate-500">
          <span>
            Step {n} / {totalSteps}
          </span>
          <DemoProgressBar current={n} total={totalSteps} />
        </div>
        <h2 className="text-lg font-semibold" style={{ color: GOLD }}>
          {step.title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">{step.description}</p>

        {aiText ? (
          <p className="mt-3 rounded-lg border border-white/10 bg-black/40 p-3 text-xs text-slate-200">{aiText}</p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={explainMore}
            disabled={aiLoading}
            className="rounded-lg border border-premium-gold/50 px-3 py-2 text-xs font-medium text-premium-gold hover:bg-premium-gold/10 disabled:opacity-50"
          >
            {aiLoading ? "…" : "Explain more"}
          </button>
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStepIndex <= 0}
            className="rounded-lg border border-white/15 px-3 py-2 text-xs text-slate-200 hover:bg-white/5 disabled:opacity-40"
          >
            Back
          </button>
          <button
            type="button"
            onClick={nextStep}
            className="rounded-lg bg-premium-gold px-3 py-2 text-xs font-semibold text-black hover:brightness-110"
          >
            {currentStepIndex >= totalSteps - 1 ? "Finish" : "Next"}
          </button>
          <button
            type="button"
            onClick={skipDemo}
            className="ml-auto rounded-lg px-2 py-2 text-xs text-slate-500 underline hover:text-slate-300"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
