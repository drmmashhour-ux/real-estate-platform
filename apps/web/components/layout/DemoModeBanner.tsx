"use client";

import { isPublicDemoMode } from "@/lib/demo-mode";

/**
 * Investor demo strip — safe data, simulated payments when DEMO_MODE is on.
 * Renders nothing in production builds without NEXT_PUBLIC_DEMO_MODE.
 */
export function DemoModeBanner() {
  if (!isPublicDemoMode()) return null;

  return (
    <div className="sticky top-0 z-[60] border-b border-[#C9A646]/35 bg-[#0B0B0B]/95 px-4 py-2 text-center text-xs text-slate-300 backdrop-blur-md sm:text-sm">
      <span className="font-semibold text-[#C9A646]">Demo mode</span>
      <span className="mx-2 hidden text-slate-600 sm:inline">·</span>
      <span className="block sm:inline">
        Presentation environment — data may be simulated; destructive actions and real payments are disabled.
      </span>
    </div>
  );
}
