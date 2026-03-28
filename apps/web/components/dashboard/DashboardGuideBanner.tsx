"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const KEY = "lecipm_dashboard_guide_dismissed";

const STEPS = [
  "Check new leads",
  "Call leads",
  "Use scripts",
  "Book meetings",
  "Close deals",
];

export function DashboardGuideBanner() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  if (dismissed) return null;

  return (
    <div className="border-b border-premium-gold/25 bg-gradient-to-r from-[#1a1508] to-[#121212] px-4 py-4 sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-premium-gold">Broker guide</p>
          <h2 className="mt-1 text-base font-bold text-white sm:text-lg">How to use your dashboard</h2>
          <ol className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#B3B3B3] sm:text-sm">
            {STEPS.map((s, i) => (
              <li key={s}>
                <span className="font-semibold text-premium-gold">{i + 1}.</span> {s}
              </li>
            ))}
          </ol>
          <div className="mt-2 flex flex-wrap gap-3 text-xs">
            <Link href="/dashboard/leads" className="font-semibold text-premium-gold hover:underline">
              Open CRM
            </Link>
            <Link href="/dashboard/training" className="font-semibold text-premium-gold hover:underline">
              Training &amp; scripts
            </Link>
            <Link href="/how-it-works" className="text-[#737373] hover:text-premium-gold">
              How LECIPM works (clients)
            </Link>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            try {
              localStorage.setItem(KEY, "1");
            } catch {
              /* ignore */
            }
            setDismissed(true);
          }}
          className="shrink-0 self-start rounded-xl border border-white/15 px-4 py-2 text-xs font-semibold text-[#B3B3B3] hover:border-premium-gold/40 hover:text-white"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
