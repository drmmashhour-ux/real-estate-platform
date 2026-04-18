"use client";

import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "bnhub_booking_exit_prompt_dismissed";

/**
 * Soft exit-intent hint when the pointer moves toward leaving the viewport (top edge).
 * One dismiss per browser session after "Continue booking". Does not emit tracking events.
 */
export function BnhubBookingExitIntentBanner({ active }: { active: boolean }) {
  const [visible, setVisible] = useState(false);
  const firedRef = useRef(false);

  useEffect(() => {
    if (!active || typeof window === "undefined") return;

    const onMove = (e: MouseEvent) => {
      if (firedRef.current || sessionStorage.getItem(STORAGE_KEY)) return;
      if (e.clientY > 14) return;
      firedRef.current = true;
      setVisible(true);
    };

    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [active]);

  if (!visible) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 left-1/2 z-50 max-w-md -translate-x-1/2 rounded-xl border border-emerald-300/90 bg-emerald-50 px-4 py-3 text-sm shadow-lg"
    >
      <p className="font-semibold text-emerald-950">Finish your booking in seconds</p>
      <p className="mt-1 text-[13px] leading-snug text-emerald-900/95">
        Your dates and total are ready — pick up where you left off.
      </p>
      <button
        type="button"
        className="mt-3 w-full rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
        onClick={() => {
          sessionStorage.setItem(STORAGE_KEY, "1");
          setVisible(false);
        }}
      >
        Continue booking
      </button>
    </div>
  );
}
