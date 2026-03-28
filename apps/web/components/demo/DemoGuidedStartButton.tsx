"use client";

import { useDemo } from "@/components/demo/demo-context";

/** Staging-only floating CTA to launch the guided tour (non-blocking). */
export function DemoGuidedStartButton() {
  const { isActive, startDemo } = useDemo();
  if (process.env.NEXT_PUBLIC_ENV !== "staging" && process.env.NEXT_PUBLIC_DEMO_TOUR !== "1") return null;
  if (isActive) return null;

  return (
    <div className="pointer-events-auto fixed bottom-5 right-5 z-[10030]">
      <button
        type="button"
        onClick={() => startDemo()}
        className="rounded-full border border-premium-gold/60 bg-[#121212]/95 px-4 py-2.5 text-xs font-semibold text-premium-gold shadow-lg backdrop-blur hover:bg-premium-gold/10 sm:text-sm"
      >
        Start Guided Demo
      </button>
    </div>
  );
}
