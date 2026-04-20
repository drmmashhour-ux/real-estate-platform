import { getDarlinkAutonomyFlags } from "@/lib/platform-flags";
import { buildMarketplaceAutonomyDashboard } from "@/modules/autonomy/darlink-autonomy-dashboard.service";
import { buildMarketplaceSnapshot } from "@/modules/autonomy/darlink-marketplace-snapshot.service";
import { buildMarketplaceSignals } from "@/modules/autonomy/darlink-signal-builder.service";
import { buildMarketplaceOpportunities } from "@/modules/autonomy/darlink-opportunity-builder.service";
import { listMarketplacePendingApprovals } from "@/modules/autonomy/darlink-approval.service";
import { DarlinkAutonomySummaryCard } from "./DarlinkAutonomySummaryCard";
import { DarlinkAutonomySignalsTable } from "./DarlinkAutonomySignalsTable";
import { DarlinkAutonomyOpportunitiesCard } from "./DarlinkAutonomyOpportunitiesCard";
import { DarlinkAutonomyApprovalQueue } from "./DarlinkAutonomyApprovalQueue";
import { DarlinkAutonomyExecutionTrail } from "./DarlinkAutonomyExecutionTrail";
import { DarlinkAutonomyOptimizationCard } from "./DarlinkAutonomyOptimizationCard";
import { DarlinkAutonomyRunActions } from "./DarlinkAutonomyRunActions";

/** Feature-flagged marketplace autonomy dashboard — Syria-local intelligence only. */
export async function DarlinkMarketplaceAutonomySection() {
  const flags = getDarlinkAutonomyFlags();
  if (!flags.AUTONOMY_ENABLED) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5 text-sm text-stone-600">
        Full marketplace autonomy is disabled. Set <code className="font-mono text-xs">DARLINK_AUTONOMY_ENABLED=true</code>{" "}
        after reviewing safety defaults.
      </div>
    );
  }

  const [dashboard, snapshot, pending] = await Promise.all([
    buildMarketplaceAutonomyDashboard(),
    buildMarketplaceSnapshot({ portfolio: true }),
    listMarketplacePendingApprovals(),
  ]);

  const signals = buildMarketplaceSignals(snapshot);
  const opportunities = buildMarketplaceOpportunities(signals, snapshot);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-stone-900">Darlink marketplace autonomy OS</h3>
        <p className="mt-1 text-sm text-stone-600">
          Deterministic signals → opportunities → policy → governance → gated execution. Defaults stay dry-run / approval-first.
        </p>
      </div>

      <DarlinkAutonomySummaryCard freshness={dashboard.freshness} totals={dashboard.totals} />

      <div className="grid gap-6 lg:grid-cols-2">
        <DarlinkAutonomySignalsTable signals={signals} />
        <DarlinkAutonomyOpportunitiesCard
          opportunities={opportunities.map((o) => ({
            id: o.id,
            title: o.title,
            rationale: o.rationale,
            priority: o.priority,
          }))}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DarlinkAutonomyApprovalQueue pending={pending} />
        <DarlinkAutonomyExecutionTrail
          rows={snapshot.executionRecent.map((r) => ({
            actionType: r.actionType,
            outcome: r.outcome,
            createdAt: r.createdAt,
          }))}
        />
      </div>

      <DarlinkAutonomyOptimizationCard
        working={dashboard.optimization.working}
        blocked={dashboard.optimization.blocked}
        needsHumanReview={dashboard.optimization.needsHumanReview}
        thresholdHints={dashboard.optimization.thresholdAdjustmentsHint}
      />

      <DarlinkAutonomyRunActions />
    </div>
  );
}
