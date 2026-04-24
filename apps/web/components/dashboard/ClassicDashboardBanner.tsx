"use client";

import { LecipmConsoleAnalytics } from "@/components/dashboard/LecipmConsoleAnalytics";
import { LecipmConsolePromoteButton } from "@/components/dashboard/LecipmConsoleSwitch";

/** Classic `/dashboard` portfolio shell — promote LECIPM OS without breaking deep links. */
export function ClassicDashboardBanner() {
  return (
    <>
      <LecipmConsoleAnalytics variant="classic" />
      <div className="mb-4 flex items-center justify-between rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-blue-400">⚠️</span>
          <span className="text-[10px] font-bold text-blue-300 uppercase tracking-widest">Simulation Mode Active</span>
          <span className="text-[10px] text-blue-400/80 italic">— Information on this platform is for educational purposes and does not constitute financial or legal advice.</span>
        </div>
        <div className="flex gap-4">
          <span className="text-[10px] text-slate-500">OACIQ: BROKERAGE</span>
          <span className="text-[10px] text-slate-500">AMF: FINANCIAL (SIM)</span>
        </div>
      </div>
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
