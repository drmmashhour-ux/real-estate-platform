"use client";

import Link from "next/link";

import { autonomyGlassCard, autonomyGoldText, autonomyMuted } from "./autonomy-styles";

export type LiveFeedRow = {
  id: string;
  domain: string;
  domainLabel: string;
  action: string;
  result: string;
  timestamp: string;
  explanationPreview?: string;
  drilldownHref: string;
};

export function LiveAutonomyFeed(props: { items: LiveFeedRow[] }) {
  return (
    <section className={`${autonomyGlassCard} p-5`}>
      <header className="mb-4 flex flex-wrap items-end justify-between gap-2 border-b border-[#D4AF37]/15 pb-3">
        <div>
          <p className={`text-xs uppercase tracking-[0.25em] ${autonomyMuted}`}>Section 02</p>
          <h2 className={`font-serif text-xl ${autonomyGoldText}`}>Live autonomy feed</h2>
          <p className={`mt-1 text-sm ${autonomyMuted}`}>Recent executions — click through for explanation bundles.</p>
        </div>
      </header>
      <ul className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
        {props.items.length === 0 ?
          <li className={`rounded-lg border border-[#D4AF37]/10 px-3 py-4 text-sm ${autonomyMuted}`}>
            No executions indexed yet — feed fills as autopilot orchestrations land.
          </li>
        : props.items.map((row) => (
            <li key={row.id}>
              <Link
                href={row.drilldownHref}
                className="block rounded-xl border border-transparent px-3 py-3 transition hover:border-[#D4AF37]/35 hover:bg-[#D4AF37]/5"
              >
                <div className="flex flex-wrap justify-between gap-2">
                  <span className={`text-xs font-semibold uppercase tracking-wide ${autonomyGoldText}`}>
                    {row.domainLabel}
                  </span>
                  <time className={`text-[11px] ${autonomyMuted}`} dateTime={row.timestamp}>
                    {new Date(row.timestamp).toLocaleString()}
                  </time>
                </div>
                <p className="mt-1 text-sm text-[#f4efe4]">
                  <span className="font-medium">{row.action}</span>
                  <span className={`mx-2 ${autonomyMuted}`}>→</span>
                  <span>{row.result}</span>
                </p>
                {row.explanationPreview ?
                  <p className={`mt-1 line-clamp-2 text-xs ${autonomyMuted}`}>{row.explanationPreview}</p>
                : null}
              </Link>
            </li>
          ))
        }
      </ul>
    </section>
  );
}
