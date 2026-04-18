"use client";

import * as React from "react";

/**
 * Advisory one-liner when learning reports weak evidence or a poor negative mix (read-only).
 */
export function GrowthLearningAdvisoryStrip() {
  const [msg, setMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    void fetch("/api/growth/learning", { credentials: "same-origin" })
      .then(async (r) => {
        if (!r.ok) return null;
        return r.json() as Promise<{
          summary?: { warnings?: string[]; negativeRate?: number; outcomesLinked?: number };
        }>;
      })
      .then((j) => {
        if (cancelled || !j?.summary) return;
        const w = j.summary.warnings ?? [];
        if (w.some((x) => x.includes("low_evidence"))) {
          setMsg("Learning: limited evidence — treat priorities as conservative.");
          return;
        }
        if ((j.summary.negativeRate ?? 0) > 0.45 && (j.summary.outcomesLinked ?? 0) >= 5) {
          setMsg("Learning: elevated negative outcome mix — review governance and follow-up signals.");
          return;
        }
        setMsg(null);
      })
      .catch(() => {
        if (!cancelled) setMsg(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!msg) return null;

  return (
    <div className="rounded-lg border border-violet-800/40 bg-violet-950/30 px-3 py-2 text-xs text-violet-100/90">
      {msg}
    </div>
  );
}
