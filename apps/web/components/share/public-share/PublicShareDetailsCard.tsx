"use client";

import { Calendar } from "lucide-react";

type Props = {
  checkInIso: string;
  checkOutIso: string;
};

export function PublicShareDetailsCard({ checkInIso, checkOutIso }: Props) {
  return (
    <section
      className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-inner shadow-black/30"
      aria-label="Stay details"
    >
      <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Stay details</h2>
      <div className="mt-4 flex items-start gap-2 text-sm text-slate-300">
        <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-slate-600" aria-hidden />
        <div>
          <p>
            <span className="text-slate-500">Check-in</span>{" "}
            <time dateTime={checkInIso}>{new Date(checkInIso).toLocaleString()}</time>
          </p>
          <p className="mt-2">
            <span className="text-slate-500">Check-out</span>{" "}
            <time dateTime={checkOutIso}>{new Date(checkOutIso).toLocaleString()}</time>
          </p>
        </div>
      </div>
    </section>
  );
}
