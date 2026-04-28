"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { getDemoMetricsAtTick } from "@/lib/demo/demo-metrics";
import { normalizeDemoRoutePath } from "@/lib/demo/narrator";
import { useAutoNarration } from "@/components/demo/NarrationProvider";
import { useStoryMode } from "@/components/demo/story-mode-context";

const TICK_MS = 4000;

export function DemoMetricsOverlay() {
  const narration = useAutoNarration();
  const pathname = usePathname();
  const storyMode = useStoryMode();

  const [tick, setTick] = useState(0);

  const visible = useMemo(() => {
    if (!narration?.investorDemoActive) return false;
    const norm = normalizeDemoRoutePath(pathname ?? "");
    const onDemoHub = norm === "/demo" || norm.startsWith("/demo/");
    const storyRunning = Boolean(storyMode?.running);
    return onDemoHub || storyRunning;
  }, [narration?.investorDemoActive, pathname, storyMode?.running]);

  useEffect(() => {
    if (!visible) return;
    const id = window.setInterval(() => {
      setTick((t) => t + 1);
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [visible]);

  const metrics = useMemo(() => getDemoMetricsAtTick(tick), [tick]);

  if (!visible) return null;

  return (
    <aside
      aria-label="Simulated investor metrics"
      className="fixed end-4 top-[calc(5.5rem+env(safe-area-inset-top))] z-[58] w-[min(100vw-2rem,18rem)] rounded-2xl border border-white/25 bg-white/12 px-4 py-3 shadow-[0_16px_48px_rgba(0,0,0,0.35)] backdrop-blur-xl [dir=rtl]:text-right"
    >
      <p className="mb-2 border-b border-white/15 pb-2 text-[10px] font-semibold uppercase tracking-wider text-white/75">
        Simulated investor metrics
      </p>
      <ul
        aria-live="polite"
        aria-atomic="true"
        className="space-y-1.5 text-xs font-medium leading-snug text-white/95"
      >
        <li className="tabular-nums">
          <span aria-hidden>📈 </span>Revenue: {metrics.revenue}
        </li>
        <li className="tabular-nums">
          <span aria-hidden>📊 </span>Growth: {metrics.growth}
        </li>
        <li className="tabular-nums">
          <span aria-hidden>🧾 </span>Bookings: {metrics.bookings.toLocaleString()}
        </li>
        <li className="tabular-nums">
          <span aria-hidden>🎯 </span>Conversion: {metrics.conversionRate}
        </li>
        <li className="tabular-nums">
          <span aria-hidden>🛡 </span>Fraud prevented: {metrics.fraudPrevented.toLocaleString()}
        </li>
        <li className="tabular-nums">
          <span aria-hidden>👥 </span>Active users: {metrics.activeUsers.toLocaleString()}
        </li>
      </ul>
      <p className="mt-2 text-[10px] font-medium leading-tight text-white/55">
        Not connected to production data — presentation only.
      </p>
    </aside>
  );
}
