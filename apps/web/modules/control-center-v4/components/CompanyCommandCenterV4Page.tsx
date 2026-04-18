"use client";

import { useSearchParams } from "next/navigation";
import type { CommandCenterRole, CommandCenterRoleView, CompanyCommandCenterV3Shared } from "@/modules/control-center-v3/company-command-center-v3.types";
import { FounderView } from "@/modules/control-center-v3/components/roles/FounderView";
import { GrowthView } from "@/modules/control-center-v3/components/roles/GrowthView";
import { OperationsView } from "@/modules/control-center-v3/components/roles/OperationsView";
import { RiskGovernanceView } from "@/modules/control-center-v3/components/roles/RiskGovernanceView";
import { RoleSwitcher, useCommandCenterV3RoleFromUrl } from "@/modules/control-center-v3/components/RoleSwitcher";
import { useCompanyCommandCenterV4 } from "../hooks/useCompanyCommandCenterV4";
import { AnomalyDigestBlock } from "./AnomalyDigestBlock";
import { BriefingCardsBlock } from "./BriefingCardsBlock";
import { ChangesSinceYesterdayBlock } from "./ChangesSinceYesterdayBlock";
import { CommandCenterV4Header } from "./CommandCenterV4Header";
import { PresetSelector } from "./PresetSelector";
import { SavedPresetsBlock } from "./SavedPresetsBlock";

const ROLE_LABEL: Record<CommandCenterRole, string> = {
  founder: "Founder",
  growth: "Growth",
  operations: "Operations",
  risk_governance: "Risk / Governance",
};

function RolePanel({
  role,
  view,
  shared,
}: {
  role: CommandCenterRole;
  view: CommandCenterRoleView;
  shared: CompanyCommandCenterV3Shared;
}) {
  switch (role) {
    case "founder":
      return <FounderView {...props} />;
    case "growth":
      return <GrowthView view={view} shared={shared} />;
    case "operations":
      return <OperationsView view={view} shared={shared} />;
    case "risk_governance":
      return <RiskGovernanceView view={view} shared={shared} />;
    default:
      return <FounderView view={view} shared={shared} />;
  }
}

export function CompanyCommandCenterV4Page() {
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");
  const presetParam = searchParams.get("presetId");
  const role = useCommandCenterV3RoleFromUrl();

  const { data, loading, error, refetch } = useCompanyCommandCenterV4({
    role: roleParam,
    presetId: presetParam,
  });

  if (loading) {
    return <p className="text-sm text-zinc-400">Loading Company Command Center V4…</p>;
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

  const v3 = data.v3;
  const view = v3.roles[role === "risk_governance" ? "riskGovernance" : role];
  const shared = v3.shared;
  const activePresetId = data.activePreset?.id ?? presetParam;
  const roleLabel = `${ROLE_LABEL[role]}${data.activePreset ? ` · ${data.activePreset.name}` : ""}`;

  return (
    <div className="space-y-10">
      <CommandCenterV4Header data={data} activeRoleLabel={roleLabel} />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <PresetSelector presets={data.presets} activePresetId={activePresetId} />
      </div>

      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-amber-200/80">Daily briefing</h3>
        <BriefingCardsBlock cards={data.briefing.cards} />
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-rose-200/80">Anomaly digest</h3>
        <AnomalyDigestBlock items={data.anomalyDigest.items} counts={data.anomalyDigest.countsBySeverity} />
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">What changed (prior window)</h3>
        <ChangesSinceYesterdayBlock
          systems={data.changesSinceYesterday.systems}
          executiveSummary={data.changesSinceYesterday.executiveSummary}
          insufficientBaseline={data.changesSinceYesterday.insufficientBaseline}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <section className="space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Role view (V3)</h3>
          <RoleSwitcher active={role} />
          {!shared.systems ? (
            <p className="text-xs text-zinc-500">Subsystem matrix unavailable.</p>
          ) : (
            <RolePanel role={role} view={view} shared={shared} />
          )}
        </section>
        <SavedPresetsBlock presets={data.presets} />
      </div>

      <p className="text-[10px] text-zinc-600">
        Cards: {data.meta.cardsGenerated} · Digest: {data.meta.digestItemCount} · Deltas: {data.meta.deltaSummaryCount} · Missing:{" "}
        {data.meta.missingSources.length}
        <button type="button" onClick={() => void refetch()} className="ml-2 text-zinc-500 underline hover:text-zinc-400">
          Refresh
        </button>
      </p>
    </div>
  );
}
