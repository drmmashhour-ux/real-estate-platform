"use client";

import { useSeniorLivingAccessibility } from "./SeniorLivingAccessibilityProvider";

/** “Simple Mode” — larger text, fewer decorative elements (persisted). */
export function SimpleModeToggle() {
  const { simpleMode, setSimpleMode } = useSeniorLivingAccessibility();

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border-2 border-neutral-800 bg-neutral-50 px-4 py-3">
      <label className="flex cursor-pointer items-center gap-3 text-lg font-semibold text-neutral-900">
        <input
          type="checkbox"
          checked={simpleMode}
          onChange={(e) => setSimpleMode(e.target.checked)}
          className="h-7 w-7 shrink-0 rounded border-2 border-neutral-800 accent-teal-700"
          aria-describedby="simple-mode-help"
        />
        Simple Mode
      </label>
      <p id="simple-mode-help" className="w-full text-base text-neutral-700 sm:w-auto sm:pl-2">
        Bigger text and a calmer layout. Your choice is saved on this device.
      </p>
    </div>
  );
}
