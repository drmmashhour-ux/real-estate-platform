"use client";

import type { ReactNode } from "react";

/** Tablet-friendly heading for AI-assisted map / heat layers (no technical jargon). */
export function SeniorMapSmartHeading(props: { subtitle?: string }) {
  return (
    <div className="rounded-xl border-2 border-teal-800/30 bg-teal-50/80 px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-wide text-teal-900">Map assist</p>
      <p className="mt-1 text-lg font-bold text-neutral-900">Best areas for your needs</p>
      {props.subtitle ?
        <p className="mt-2 text-base font-medium text-neutral-700">{props.subtitle}</p>
      : (
        <p className="mt-2 text-base font-medium text-neutral-700">
          Warmer colors highlight neighborhoods where places fit what you asked for — optional, only if you want it.
        </p>
      )}
    </div>
  );
}

export function SeniorMapSmartSection(props: { heading?: ReactNode; children: ReactNode }) {
  return (
    <section className="space-y-4">
      {props.heading}
      {props.children}
    </section>
  );
}
