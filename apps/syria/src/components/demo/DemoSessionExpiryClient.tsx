"use client";

import { useEffect, useState } from "react";

type Props = {
  expiresAtIso: string;
  warnWithinMinutes?: number;
};

/** Live countdown for demo session TTL — purely informational; expiry enforced server-side. */
export function DemoSessionExpiryClient({ expiresAtIso, warnWithinMinutes = 10 }: Props) {
  const [minutesLeft, setMinutesLeft] = useState<number | null>(null);

  useEffect(() => {
    function tick() {
      const exp = Date.parse(expiresAtIso);
      if (Number.isNaN(exp)) return;
      const m = Math.max(0, Math.ceil((exp - Date.now()) / 60_000));
      setMinutesLeft(m);
    }
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [expiresAtIso]);

  if (minutesLeft === null) return null;

  const warn = minutesLeft <= warnWithinMinutes && minutesLeft > 0;

  return (
    <p
      className={`mt-1 text-xs font-semibold ${warn ? "text-amber-950" : "text-amber-900/85"}`}
      suppressHydrationWarning
    >
      ⏱ Demo expires in {minutesLeft} minute{minutesLeft === 1 ? "" : "s"}
      {warn ? " — wrap up soon" : ""}
    </p>
  );
}
