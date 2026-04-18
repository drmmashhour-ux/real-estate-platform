"use client";

import { useSearchParams } from "next/navigation";
import type { CommandCenterV6Mode } from "../company-command-center-v6.types";
import { useCompanyCommandCenterV6 } from "../hooks/useCompanyCommandCenterV6";
import { CommandCenterV6Header } from "./CommandCenterV6Header";
import { AuditTrailModeView } from "./modes/AuditTrailModeView";
import { DueDiligenceModeView } from "./modes/DueDiligenceModeView";
import { LaunchWarRoomModeView } from "./modes/LaunchWarRoomModeView";
import { WeeklyBoardPackModeView } from "./modes/WeeklyBoardPackModeView";
import { ModeSwitcher, useCommandCenterV6ModeFromUrl } from "./ModeSwitcher";

function ModePanel({
  mode,
  data,
}: {
  mode: CommandCenterV6Mode;
  data: NonNullable<ReturnType<typeof useCompanyCommandCenterV6>["data"]>;
}) {
  const m = data.modes;
  switch (mode) {
    case "weekly_board_pack":
      return <WeeklyBoardPackModeView view={m.weeklyBoardPack} quickKpis={data.shared.quickKpis} />;
    case "due_diligence":
      return <DueDiligenceModeView view={m.dueDiligence} />;
    case "launch_war_room":
      return <LaunchWarRoomModeView view={m.launchWarRoom} />;
    case "audit_trail":
      return <AuditTrailModeView data={data} />;
    default:
      return <WeeklyBoardPackModeView view={m.weeklyBoardPack} quickKpis={data.shared.quickKpis} />;
  }
}

export function CompanyCommandCenterV6Page() {
  const searchParams = useSearchParams();
  const mode = useCommandCenterV6ModeFromUrl();
  const role = searchParams.get("role");
  const presetId = searchParams.get("presetId");

  const { data, loading, error, refetch } = useCompanyCommandCenterV6({
    role,
    presetId,
  });

  if (loading) {
    return <p className="text-sm text-zinc-400">Loading Company Command Center V6…</p>;
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
      <CommandCenterV6Header data={data} />
      <ModeSwitcher active={mode} />
      <ModePanel mode={mode} data={data} />
      <p className="text-[10px] text-zinc-600">
        Highlights: {data.meta.highlightsGenerated} · Missing sources: {data.meta.missingSources.length} · Audit rows:{" "}
        {data.meta.auditEntryCount}
        {data.meta.focusedMode ? ` · Focused API mode: ${data.meta.focusedMode}` : ""}
        <button type="button" onClick={() => void refetch()} className="ml-2 text-zinc-500 underline hover:text-zinc-400">
          Refresh
        </button>
      </p>
    </div>
  );
}
