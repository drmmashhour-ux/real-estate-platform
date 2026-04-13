"use client";

import Link from "next/link";
import { useDemo } from "@/components/demo/demo-context";

/** Secondary entry: tour variants + help link (staging / demo flag). */
export function DemoLaunchButton() {
  const { isActive, startDemo, dismissForSession } = useDemo();
  if (process.env.NEXT_PUBLIC_ENV !== "staging" && process.env.NEXT_PUBLIC_DEMO_TOUR !== "1") return null;

  return (
    <div className="pointer-events-auto fixed bottom-5 left-5 z-[10030] flex max-w-[min(100vw-2.5rem,280px)] flex-col gap-2 rounded-2xl border border-white/10 bg-[#121212]/95 p-3 text-xs text-slate-300 shadow-xl backdrop-blur">
      <p className="font-semibold text-premium-gold">Guided tour</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={isActive}
          onClick={() => startDemo("standard_user_tour", "launch_button")}
          className="rounded-lg bg-premium-gold/20 px-2 py-1.5 font-medium text-premium-gold hover:bg-premium-gold/30 disabled:opacity-40"
        >
          Standard
        </button>
        <button
          type="button"
          disabled={isActive}
          onClick={() => startDemo("investor_tour", "launch_button")}
          className="rounded-lg border border-white/15 px-2 py-1.5 hover:bg-white/5 disabled:opacity-40"
        >
          Investor
        </button>
      </div>
      <Link href="/demos" className="text-[11px] text-slate-500 underline hover:text-slate-300">
        Demo overview
      </Link>
      <button type="button" onClick={dismissForSession} className="text-left text-[11px] text-slate-500 hover:text-slate-400">
        Dismiss panel (session)
      </button>
    </div>
  );
}
