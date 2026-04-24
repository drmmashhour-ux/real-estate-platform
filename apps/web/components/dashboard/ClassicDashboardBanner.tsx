"use client";

import { LecipmConsoleAnalytics } from "@/components/dashboard/LecipmConsoleAnalytics";
import { LecipmConsolePromoteButton } from "@/components/dashboard/LecipmConsoleSwitch";

/** Classic `/dashboard` portfolio shell — promote LECIPM OS without breaking deep links. */
export function ClassicDashboardBanner() {
  return (
    <>
      <LecipmConsoleAnalytics variant="classic" />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/35 px-4 py-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-premium-gold">LECIPM OS</p>
          <p className="mt-1 max-w-xl text-sm text-white/90">
            Switch to the operations console anytime. Your choice is saved on this device for the next visit.
          </p>
        </div>
        <LecipmConsolePromoteButton />
      </div>
    </>
  );
}
