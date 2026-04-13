"use client";

import { useEffect, useState } from "react";

export function BookingCalendar({ listingId }: { listingId: string }) {
  const [booked, setBooked] = useState<string[]>([]);
  const [available, setAvailable] = useState<string[]>([]);
  const [external, setExternal] = useState<string[]>([]);

  useEffect(() => {
    fetch(`/api/bnhub/availability-summary?listingId=${encodeURIComponent(listingId)}`)
      .then((r) => r.json())
      .then((d) => {
        setBooked(Array.isArray(d.bookedDates) ? d.bookedDates : []);
        setAvailable(Array.isArray(d.availableDates) ? d.availableDates : []);
        setExternal(Array.isArray(d.externalBlockedDates) ? d.externalBlockedDates : []);
      })
      .catch(() => {});
  }, [listingId]);

  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-slate-200">
      <h3 className="font-semibold text-white">Availability</h3>
      <p className="mt-2 text-xs text-slate-400">
        BNHUB reservations: {booked.length} night(s) shown · Other-channel holds: {external.length} · Open next 30
        days: {available.length}
      </p>
      <p className="mt-1 text-[11px] text-slate-500">
        Calendar syncs from the host&apos;s channel manager; BNHUB does not guarantee third-party accuracy.
      </p>
    </div>
  );
}

