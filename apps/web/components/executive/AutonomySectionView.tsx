"use client";

import { Card } from "@/components/ui/Card";
import type { AutonomySection } from "@/modules/executive-reporting/executive-report.types";

export function AutonomySectionView({ autonomy }: { autonomy: AutonomySection }) {
  return (
    <Card variant="dashboardPanel" className="space-y-3">
      <h3 className="text-base font-semibold text-[#0B0B0B]">Autonomy</h3>
      <p className="text-sm text-zinc-700">
        Actions in period: {autonomy.actionsCreatedInPeriod.value ?? "n/a"} — executed/approved/success:{" "}
        {autonomy.approvals.value ?? "n/a"} — rejected/skipped/blocked: {autonomy.blockedOrRejected.value ?? "n/a"}
      </p>
      <div>
        <h4 className="text-sm font-medium text-zinc-800">By status</h4>
        <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-zinc-700">
          {Object.entries(autonomy.byStatus).map(([k, v]) => (
            <li key={k}>
              {k}: {v}
            </li>
          ))}
        </ul>
      </div>
      <p className="text-xs text-zinc-600">{autonomy.autonomyModeSummary}</p>
      {autonomy.assumptions.length > 0 && (
        <ul className="list-disc space-y-1 pl-4 text-xs text-zinc-600">
          {autonomy.assumptions.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      )}
    </Card>
  );
}
