"use client";

import { Button } from "@/components/ui/Button";

import { autonomyGlassCard, autonomyGoldText, autonomyMuted } from "./autonomy-styles";

export type DomainMatrixRow = {
  uiDomainId: string;
  title: string;
  technicalDomains: string[];
  modeLabel: string;
  riskLevel: string;
  successRate: number | null;
  killSwitchAggregate: string;
  fullAutopilotBoundedEligible: boolean;
};

export function DomainMatrix(props: {
  rows: DomainMatrixRow[];
  onRefresh: () => Promise<void>;
}) {
  return (
    <section className={`${autonomyGlassCard} p-5`}>
      <header className="mb-4 border-b border-[#D4AF37]/15 pb-3">
        <p className={`text-xs uppercase tracking-[0.25em] ${autonomyMuted}`}>Section 03</p>
        <h2 className={`font-serif text-xl ${autonomyGoldText}`}>Domain control matrix</h2>
        <p className={`mt-1 text-sm ${autonomyMuted}`}>
          Executive lanes aggregate underlying autopilot domains. Full autonomy stays bounded by policy — never blind for
          capital, pricing, or compliance.
        </p>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse text-left text-sm">
          <thead>
            <tr className={`border-b border-[#D4AF37]/15 text-[11px] uppercase tracking-wide ${autonomyMuted}`}>
              <th className="py-2 pr-3">Domain</th>
              <th className="py-2 pr-3">Current</th>
              <th className="py-2 pr-3">Risk</th>
              <th className="py-2 pr-3">Success</th>
              <th className="py-2 pr-3">Kill</th>
              <th className="py-2 pr-3">Mode</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {props.rows.map((r) => (
              <tr key={r.uiDomainId} className="border-b border-[#D4AF37]/10 align-top">
                <td className="py-3 pr-3">
                  <p className="font-medium text-[#f4efe4]">{r.title}</p>
                  <p className={`text-[11px] ${autonomyMuted}`}>{r.technicalDomains.join(" · ")}</p>
                  {r.fullAutopilotBoundedEligible ?
                    <p className="mt-1 text-[10px] text-emerald-300/90">Bounded full lane eligible (policy)</p>
                  : null}
                </td>
                <td className="py-3 pr-3 text-[#e8dfd0]">{r.modeLabel}</td>
                <td className="py-3 pr-3">
                  <span className="rounded-full border border-[#D4AF37]/30 px-2 py-0.5 text-[11px] uppercase text-[#D4AF37]">
                    {r.riskLevel}
                  </span>
                </td>
                <td className="py-3 pr-3 text-[#e8dfd0]">
                  {r.successRate == null ? "—" : `${(r.successRate * 100).toFixed(1)}%`}
                </td>
                <td className="py-3 pr-3 text-[#e8dfd0]">{r.killSwitchAggregate}</td>
                <td className="py-3 pr-3">
                  <select
                    className="w-full rounded-lg border border-[#D4AF37]/25 bg-black/60 px-2 py-1.5 text-xs text-[#f4efe4]"
                    defaultValue=""
                    onChange={(e) => {
                      const v = e.target.value as "OFF" | "ASSIST" | "SAFE" | "FULL" | "";
                      if (!v) return;
                      void (async () => {
                        await fetch(`/api/autonomy-command-center/domain/${r.uiDomainId}/slot`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ slot: v }),
                        });
                        e.target.value = "";
                        await props.onRefresh();
                      })();
                    }}
                  >
                    <option value="">Set lane…</option>
                    <option value="OFF">Off</option>
                    <option value="ASSIST">Assist</option>
                    <option value="SAFE">Safe</option>
                    <option value="FULL">Full (capped)</option>
                  </select>
                </td>
                <td className="py-3">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="danger"
                      size="sm"
                      className="!px-2 !py-1 !text-xs"
                      onClick={() =>
                        void (async () => {
                          await fetch(`/api/autonomy-command-center/domain/${r.uiDomainId}/kill`, { method: "POST" });
                          await props.onRefresh();
                        })()
                      }
                    >
                      Kill lane
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
