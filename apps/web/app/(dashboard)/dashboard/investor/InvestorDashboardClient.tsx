"use client";

import Link from "next/link";
import { useState } from "react";
import { HubAiDock } from "@/components/ai/HubAiDock";

type ScenarioRow = {
  id: string;
  title: string;
  scenarioKind: string | null;
  projectedAverageRoiPercent: number;
  projectedMonthlyCashFlowCents: number;
  projectedRiskLevel: string | null;
  updatedAt: Date | string;
  _count: { items: number };
};

function InvestorScenarioRead({ scenarios }: { scenarios: ScenarioRow[] }) {
  const primary = scenarios[0];
  if (!primary) return null;
  const roi = Number(primary.projectedAverageRoiPercent);
  const roiStr = Number.isFinite(roi) ? `${roi.toFixed(1)}%` : "—";
  const risk = String(primary.projectedRiskLevel ?? "medium").toUpperCase();
  const riskWhy =
    risk === "HIGH"
      ? "Higher modeled risk — stress-test rent, vacancy, and rates before you commit capital."
      : risk === "LOW"
        ? "Lower modeled risk in this scenario — still confirm assumptions with your own diligence."
        : "Balanced risk band — validate cash flow and comps against current listings.";
  const byRoi = [...scenarios]
    .filter((s) => Number.isFinite(Number(s.projectedAverageRoiPercent)))
    .sort((a, b) => Number(b.projectedAverageRoiPercent) - Number(a.projectedAverageRoiPercent));
  const best = byRoi[0];
  const worst = byRoi.length > 1 ? byRoi[byRoi.length - 1] : null;

  return (
    <section className="rounded-2xl border border-[#C9A646]/25 bg-[#111]/80 p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#C9A646]">Scenario read</p>
      <p className="mt-2 text-sm leading-relaxed text-slate-200">
        “{primary.title}” averages ~{roiStr} ROI (est.) with {risk} risk in this model — illustrative only; confirm with your own analysis.
      </p>
      <p className="mt-2 text-xs leading-relaxed text-slate-500">{riskWhy}</p>
      {best && worst && best.id !== worst.id ? (
        <p className="mt-3 text-xs text-slate-400">
          Highest ROI scenario: {best.title} ({Number(best.projectedAverageRoiPercent).toFixed(1)}% est.). Lowest: {worst.title} (
          {Number(worst.projectedAverageRoiPercent).toFixed(1)}% est.).
        </p>
      ) : null}
    </section>
  );
}

export function InvestorDashboardClient({
  scenarios,
  compareIds,
}: {
  scenarios: ScenarioRow[];
  compareIds: string[];
}) {
  const [msg, setMsg] = useState<string | null>(null);

  async function dup(id: string) {
    setMsg(null);
    const res = await fetch(`/api/investor/portfolio/${id}/duplicate`, { method: "POST", credentials: "same-origin" });
    const j = await res.json();
    if (!res.ok) setMsg(j.error ?? "Failed");
    else window.location.reload();
  }

  async function del(id: string) {
    if (!confirm("Delete this scenario?")) return;
    await fetch(`/api/investor/portfolio/${id}`, { method: "DELETE", credentials: "same-origin" });
    window.location.reload();
  }

  return (
    <div className="space-y-8">
      <HubAiDock hub="investor" context={{ scenarioCount: scenarios.length }} />

      {scenarios.length > 0 ? <InvestorScenarioRead scenarios={scenarios} /> : null}

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-lg font-semibold text-white">Saved portfolio scenarios</h2>
        {scenarios.length === 0 ? (
          <div className="mt-4 rounded-xl border border-[#C9A646]/25 bg-[#111]/80 p-5">
            <p className="text-sm text-slate-300">
              No saved scenarios yet. Run the portfolio planner to generate conservative / balanced / aggressive previews — all figures are estimates.
            </p>
            <Link
              href="/invest/portfolio"
              className="mt-4 inline-flex rounded-xl bg-[#C9A646] px-5 py-2.5 text-sm font-bold text-black hover:bg-[#d4b35a]"
            >
              Open portfolio planner
            </Link>
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {scenarios.map((s) => {
              const roi = Number(s.projectedAverageRoiPercent);
              const cfCents = Number(s.projectedMonthlyCashFlowCents);
              const roiStr = Number.isFinite(roi) ? `${roi.toFixed(1)}%` : "—";
              const cfStr = Number.isFinite(cfCents) ? `$${(cfCents / 100).toFixed(0)}` : "—";
              return (
              <li
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/30 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-white">{s.title}</p>
                  <p className="text-xs text-slate-500">
                    {s._count.items} properties · Avg ROI (est.) {roiStr} · Monthly CF (est.) {cfStr}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={`/api/investor/portfolio/${s.id}/pdf`}
                    className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-white"
                  >
                    PDF
                  </a>
                  <button type="button" onClick={() => void dup(s.id)} className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-white">
                    Duplicate
                  </button>
                  <button type="button" onClick={() => void del(s.id)} className="rounded-lg border border-red-500/40 px-3 py-1.5 text-xs text-red-300">
                    Delete
                  </button>
                </div>
              </li>
              );
            })}
          </ul>
        )}
        {msg ? <p className="mt-2 text-sm text-red-400">{msg}</p> : null}
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-lg font-semibold text-white">Compare queue</h2>
        <p className="mt-1 text-sm text-slate-400">
          {compareIds.length} listing{compareIds.length === 1 ? "" : "s"} in compare
          {compareIds.length ? (
            <Link href="/compare" className="ml-2 text-[#C9A646] hover:underline">
              Open compare
            </Link>
          ) : null}
        </p>
      </section>
    </div>
  );
}
