import type { ComponentProps } from "react";
import Link from "next/link";
import { TractionCard } from "./TractionCard";
import { First100Tracker } from "./First100Tracker";
import { GrowthChannelsPanel } from "./GrowthChannelsPanel";
import { InvestorMetricsCard } from "./InvestorMetricsCard";
import { PositioningCard } from "./PositioningCard";
import { MilestoneTracker } from "./MilestoneTracker";

type LaunchDashboardProps = {
  basePath: string;
  traction: {
    totalUsers: number;
    milestones: {
      hundred: { target: number; progressCount: number; complete: boolean };
      thousand: { target: number; progressCount: number; complete: boolean };
    };
    firstUsersSample: ComponentProps<typeof First100Tracker>["rows"];
  };
  channels: { channels: ComponentProps<typeof GrowthChannelsPanel>["channels"]; bestChannelBySignups: string | null } | null;
  investorRows: ComponentProps<typeof InvestorMetricsCard>["rows"];
  milestones: ComponentProps<typeof MilestoneTracker>["milestones"];
  positioning: { focus: string; differentiation: ComponentProps<typeof PositioningCard>["rows"] } | null;
};

export function LaunchDashboard({
  basePath,
  traction,
  channels,
  investorRows,
  milestones,
  positioning,
}: LaunchDashboardProps) {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link href={basePath} className="text-sm text-amber-200/90 hover:underline">
          ← Espace fondateur
        </Link>
        <p className="max-w-md text-xs text-zinc-500">
          Export: POST <code className="text-zinc-400">/api/launch/investor/export</code> with{" "}
          <code className="text-zinc-400">{`{ "kind": "metrics_json" | "snapshots_csv" | "snapshots_json" | "investor_txt" }`}</code>
        </p>
      </div>

      <div className="rounded-2xl border border-amber-900/40 bg-amber-950/20 p-4 text-sm text-amber-100/90">
        <p className="font-medium text-amber-200">LECIPM Launch + Investor System v1</p>
        <p className="mt-1 text-xs text-amber-200/80">
          All figures are database-backed. Nothing here invents traction, reviews, or market share.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <TractionCard
          totalUsers={traction.totalUsers}
          to100={{
            current: traction.milestones.hundred.progressCount,
            target: traction.milestones.hundred.target,
            complete: traction.milestones.hundred.complete,
          }}
          to1000={{
            current: traction.milestones.thousand.progressCount,
            target: traction.milestones.thousand.target,
            complete: traction.milestones.thousand.complete,
          }}
        />
        <MilestoneTracker milestones={milestones} />
      </div>

      <First100Tracker rows={traction.firstUsersSample} />

      {channels ? (
        <GrowthChannelsPanel channels={channels.channels} best={channels.bestChannelBySignups} />
      ) : null}

      <InvestorMetricsCard rows={investorRows} />

      {positioning ? (
        <PositioningCard focus={positioning.focus} rows={positioning.differentiation} />
      ) : null}
    </div>
  );
}
