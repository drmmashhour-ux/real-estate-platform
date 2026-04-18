"use client";

import type { CommandCenterRole, CommandCenterRoleView, CompanyCommandCenterV3Shared } from "../company-command-center-v3.types";
import { useCompanyCommandCenterV3 } from "../hooks/useCompanyCommandCenterV3";
import { RoleSwitcher, useCommandCenterV3RoleFromUrl } from "./RoleSwitcher";
import { FounderView } from "./roles/FounderView";
import { GrowthView } from "./roles/GrowthView";
import { OperationsView } from "./roles/OperationsView";
import { RiskGovernanceView } from "./roles/RiskGovernanceView";

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
      return <FounderView view={view} shared={shared} />;
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

export function CompanyCommandCenterV3Page() {
  const role = useCommandCenterV3RoleFromUrl();
  const { data, loading, error, refetch } = useCompanyCommandCenterV3({ role: null });

  if (loading) {
    return <p className="text-sm text-zinc-400">Loading Company Command Center V3…</p>;
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

  const view = data.roles[role === "risk_governance" ? "riskGovernance" : role];
  const shared = data.shared;

  return (
    <div className="space-y-6">
      {!shared.systems ? (
        <div className="rounded-lg border border-amber-900/50 bg-amber-950/20 px-3 py-2 text-xs text-amber-100/90">
          Partial load: subsystem matrix unavailable. Narratives may be empty.
        </div>
      ) : null}
      <RoleSwitcher active={role} />
      <RolePanel role={role} view={view} shared={shared} />
      <p className="text-[10px] text-zinc-600">
        ~{Math.round(shared.meta.dataFreshnessMs / 1000)}s · Partial: {shared.meta.partialData ? "yes" : "no"} · Missing:{" "}
        {shared.meta.missingSources.length}
        <button type="button" onClick={() => void refetch()} className="ml-2 text-zinc-500 underline hover:text-zinc-400">
          Refresh
        </button>
      </p>
    </div>
  );
}
