"use client";

import { useCallback, useSyncExternalStore } from "react";
import { Contrast, Ear, Type } from "lucide-react";
import { BrandLogo } from "@/components/ui/Logo";
import { useAccessibilityPreferences } from "@/components/accessibility/AccessibilityPreferencesContext";

const STAYS_INSTRUCTIONS_EN =
  "BNHUB stays search. Use Tab to move through the search form, filters, and results. " +
  "Choose list view to browse without the map. " +
  "Each result link includes the property type, city, nightly price, and number of bedrooms. " +
  "Press Enter on a listing to open its detail page.";

const btnBase =
  "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-premium-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]";

/**
 * BNHUB stays page — compact accessibility controls + LECIPM signature (same type scale as global shell).
 */
function subscribeNoop() {
  return () => {};
}

export function StaysAccessibilityToolbar() {
  const { enhanced, toggleEnhanced } = useAccessibilityPreferences();
  const speechOk = useSyncExternalStore(
    subscribeNoop,
    () => typeof window !== "undefined" && "speechSynthesis" in window,
    () => false
  );

  const speakInstructions = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(STAYS_INSTRUCTIONS_EN);
    u.rate = 0.95;
    u.lang = "en-CA";
    window.speechSynthesis.speak(u);
  }, []);

  return (
    <div
      role="region"
      aria-label="Accessibility options"
      className="lecipm-prestige-surface rounded-xl"
    >
      <div className="lecipm-prestige-surface__inner flex flex-col gap-3 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="sr-only">Accessibility options</span>
          <button
            type="button"
            onClick={toggleEnhanced}
            aria-pressed={enhanced}
            aria-label={
              enhanced
                ? "Disable accessibility view: larger text and higher contrast"
                : "Enable accessibility view: larger text, higher contrast, reduced animations"
            }
            className={[
              btnBase,
              enhanced
                ? "border-premium-gold/55 bg-premium-gold/12 text-premium-gold"
                : "border-premium-gold/30 bg-black/40 text-neutral-200 hover:border-premium-gold/45 hover:bg-premium-gold/8",
            ].join(" ")}
          >
            <Type className="h-4 w-4 shrink-0" aria-hidden />
            <Contrast className="h-4 w-4 shrink-0" aria-hidden />
            <span>{enhanced ? "Accessibility view on" : "Accessibility view"}</span>
          </button>
          <button
            type="button"
            onClick={speakInstructions}
            disabled={!speechOk}
            aria-disabled={!speechOk}
            title={!speechOk ? "Speech not supported in this browser" : undefined}
            className={`${btnBase} border-premium-gold/30 bg-black/40 text-neutral-200 hover:border-premium-gold/45 hover:bg-premium-gold/8 disabled:cursor-not-allowed disabled:opacity-45`}
          >
            <Ear className="h-4 w-4 shrink-0" aria-hidden />
            Listen to instructions
          </button>
        </div>
        <div className="flex shrink-0 justify-center sm:justify-end">
          <BrandLogo variant="default" href="/bnhub" className="[&_img]:max-h-8 sm:[&_img]:max-h-9" priority />
        </div>
      </div>
    </div>
  );
}
