"use client";

import { useEffect, useState } from "react";
import { CalendarClock } from "lucide-react";

/**
 * Public slots API — shows whether visit windows exist in the next 14 days.
 */
export function ListingVisitAvailabilityHint({ listingId }: { listingId: string }) {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const from = new Date();
    const to = new Date(from.getTime() + 14 * 24 * 60 * 60 * 1000);
    const q = new URLSearchParams({
      listingId,
      from: from.toISOString(),
      to: to.toISOString(),
      durationMinutes: "45",
    });
    void fetch(`/api/visits/slots?${q.toString()}`)
      .then((r) => r.json())
      .then((j: { slots?: unknown[] }) => {
        if (cancelled) return;
        const n = Array.isArray(j.slots) ? j.slots.length : 0;
        if (n > 0) {
          setLabel(`${n} visit openings in the next 2 weeks`);
        } else {
          setLabel("Broker sets visit times — request to coordinate");
        }
      })
      .catch(() => {
        if (!cancelled) setLabel(null);
      });
    return () => {
      cancelled = true;
    };
  }, [listingId]);

  if (!label) return null;

  return (
    <li className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-100/95">
      <CalendarClock className="h-3.5 w-3.5 shrink-0 text-emerald-300/90" aria-hidden />
      {label}
    </li>
  );
}
