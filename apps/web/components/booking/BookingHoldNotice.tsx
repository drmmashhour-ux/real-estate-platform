"use client";

import { useEffect, useState } from "react";

type Props = { expiresAtIso: string | null };

/**
 * Optional countdown for the 15-minute marketplace hold (Order 57.1).
 */
export function BookingHoldNotice({ expiresAtIso }: Props) {
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!expiresAtIso) {
      setLeft(null);
      return;
    }
    const end = new Date(expiresAtIso).getTime();
    if (Number.isNaN(end)) {
      setLeft(null);
      return;
    }
    const tick = () => {
      const ms = end - Date.now();
      setLeft(ms <= 0 ? 0 : ms);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [expiresAtIso]);

  if (expiresAtIso == null) {
    return (
      <p className="text-sm text-amber-800 dark:text-amber-200/90" role="status">
        This booking is reserved for 15 minutes while you complete payment at checkout.
      </p>
    );
  }
  if (left === null) return null;
  const m = Math.floor(left / 60_000);
  const s = Math.floor((left % 60_000) / 1000);
  return (
    <p className="text-sm text-amber-800 dark:text-amber-200/90" role="status">
      {left <= 0
        ? "Hold expired — choose dates again if checkout did not complete."
        : `This booking is reserved — complete payment in ${m}:${s.toString().padStart(2, "0")} (15 min hold from checkout).`}
    </p>
  );
}
