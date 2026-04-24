"use client";

import { useEffect, useState } from "react";

import { Link } from "@/i18n/navigation";

type Summary = {
  pendingApprovals: { id: string; status: string; bestCandidateId: string | null }[];
  recentExecuted: { id: string; status: string }[];
  failed: { id: string; status: string }[];
  bestThisWeek: { id: string; status: string; bestCandidateId: string | null } | null;
  generatedAt: string;
};

export function ScenarioAutopilotStrip() {
  const [s, setS] = useState<Summary | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let c = true;
    void (async () => {
      try {
        const r = await fetch("/api/admin/scenario-autopilot/summary", { credentials: "same-origin" });
        if (!r.ok) {
          if (c) setErr(true);
          return;
        }
        const j = (await r.json()) as Summary;
        if (c) setS(j);
      } catch {
        if (c) setErr(true);
      }
    })();
    return () => {
      c = false;
    };
  }, []);

  if (err) return null;
  if (!s) {
    return (
      <div className="mb-6 h-12 animate-pulse rounded-lg border border-[#1a1a1a] bg-[#0a0a0a]" aria-hidden />
    );
  }

  return (
    <section className="mb-8 rounded-xl border border-[#232323] bg-[#080808] p-4" aria-label="Scenario autopilot">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#D4AF37]/85">Scenario autopilot</p>
        <Link href="/dashboard/admin/scenario-autopilot" className="text-xs text-[#D4AF37] hover:underline">
          Open →
        </Link>
      </div>
      <p className="mt-1 text-sm text-neutral-400">
        Pending approvals: {s.pendingApprovals.length} · Recent executed: {s.recentExecuted.length} · Failed:{" "}
        {s.failed.length}
        {s.bestThisWeek ?
          <span className="text-neutral-500"> · Latest win (7d): {s.bestThisWeek.id.slice(0, 8)}…</span>
        : null}
      </p>
    </section>
  );
}
