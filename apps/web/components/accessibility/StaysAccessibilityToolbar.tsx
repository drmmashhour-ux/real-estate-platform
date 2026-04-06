"use client";

import { useCallback, useEffect, useState } from "react";
import { Contrast, Ear, Type } from "lucide-react";
import { useAccessibilityPreferences } from "@/components/accessibility/AccessibilityPreferencesContext";

const STAYS_INSTRUCTIONS_EN =
  "BNHub stays search. Use Tab to move through the search form, filters, and results. " +
  "Choose list view to browse without the map. " +
  "Each result link includes the property type, city, nightly price, and number of bedrooms. " +
  "Press Enter on a listing to open its detail page.";

/**
 * BNHub stays page — compact accessibility controls (larger text / contrast / reduced motion + optional speech).
 */
export function StaysAccessibilityToolbar() {
  const { enhanced, toggleEnhanced } = useAccessibilityPreferences();
  const [speechOk, setSpeechOk] = useState(false);

  useEffect(() => {
    setSpeechOk(typeof window !== "undefined" && "speechSynthesis" in window);
  }, []);

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
      className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800"
    >
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
          "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 font-medium transition focus:outline-none focus:ring-2 focus:ring-[#006ce4] focus:ring-offset-2",
          enhanced
            ? "border-emerald-600 bg-emerald-50 text-emerald-900"
            : "border-slate-300 bg-white text-slate-800 hover:bg-slate-100",
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
        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-800 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#006ce4] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Ear className="h-4 w-4 shrink-0" aria-hidden />
        Listen to instructions
      </button>
    </div>
  );
}
