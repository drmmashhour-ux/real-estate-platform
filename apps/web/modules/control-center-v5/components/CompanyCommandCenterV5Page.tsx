"use client";

import { useSearchParams } from "next/navigation";
import type { CommandCenterMode } from "../company-command-center-v5.types";
import { useCompanyCommandCenterV5 } from "../hooks/useCompanyCommandCenterV5";
import { CommandCenterV5Header } from "./CommandCenterV5Header";
import { IncidentModeView } from "./modes/IncidentModeView";
import { InvestorModeView } from "./modes/InvestorModeView";
import { LaunchModeView } from "./modes/LaunchModeView";
import { MorningBriefModeView } from "./modes/MorningBriefModeView";
import { ModeSwitcher, useCommandCenterV5ModeFromUrl } from "./ModeSwitcher";

function ModePanel({ mode, data }: { mode: CommandCenterMode; data: NonNullable<ReturnType<typeof useCompanyCommandCenterV5>["data"]> }) {
  const m = data.modes;
  switch (mode) {
    case "morning_brief":
      return <MorningBriefModeView view={m.morningBrief} quickKpis={data.shared.quickKpis} />;
    case "incident":
      return <IncidentModeView view={m.incident} />;
    case "launch":
      return <LaunchModeView view={m.launch} />;
    case "investor":
      return <InvestorModeView view={m.investor} />;
    default:
      return <MorningBriefModeView view={m.morningBrief} quickKpis={data.shared.quickKpis} />;
  }
}

export function CompanyCommandCenterV5Page() {
  const searchParams = useSearchParams();
  const mode = useCommandCenterV5ModeFromUrl();
  const role = searchParams.get("role");
  const presetId = searchParams.get("presetId");

  const { data, loading, error, refetch } = useCompanyCommandCenterV5({
    mode: searchParams.get("mode"),
    role,
    presetId,
  });

  if (loading) {
    return <p className="text-sm text-zinc-400">Loading Company Command Center V5…</p>;
  }
  if (error) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-6">
        <p className="text-sm text-amber-200">{error}</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="mt-3 rounded border border-zinc-600 px-3 py-1 text-xs text-zinc-200 hover:bg-zinc-900"
        >
          Retry
        </button>
      </div>
    );
  }
  if (!data) {
    return <p className="text-sm text-zinc-500">No data.</p>;
  }

  return (
    <div className="space-y-8">
      {!data.shared.systems ? (
        <div className="rounded-lg border border-amber-900/50 bg-amber-950/20 px-3 py-2 text-xs text-amber-100/90">
          Partial load: subsystem matrix unavailable in shared snapshot.
        </div>
      ) : null}
      <CommandCenterV5Header data={data} />
      <ModeSwitcher active={mode} />
      <ModePanel mode={mode} data={data} />
      <p className="text-[10px] text-zinc-600">
        Highlights: {data.meta.highlightsGenerated} · Missing sources: {data.meta.missingSources.length}
        <button type="button" onClick={() => void refetch()} className="ml-2 text-zinc-500 underline hover:text-zinc-400">
          Refresh
        </button>
      </p>
    </div>
  );
}
