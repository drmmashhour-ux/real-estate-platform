"use client";

import { useCompanyCommandCenterV2 } from "../hooks/useCompanyCommandCenterV2";
import { CompanyCommandCenterTabs, useCommandCenterV2TabFromUrl } from "./CompanyCommandCenterTabs";
import type { CommandCenterV2TabId } from "../company-command-center-v2.types";
import { ExecutiveTab } from "./tabs/ExecutiveTab";
import { GrowthTab } from "./tabs/GrowthTab";
import { RankingTab } from "./tabs/RankingTab";
import { BrainTab } from "./tabs/BrainTab";
import { SwarmTab } from "./tabs/SwarmTab";
import { RolloutsTab } from "./tabs/RolloutsTab";
import type { CompanyCommandCenterV2Payload } from "../company-command-center-v2.types";

export function CompanyCommandCenterV2Page() {
  const tab = useCommandCenterV2TabFromUrl();
  const { data, loading, error, refetch } = useCompanyCommandCenterV2();

  if (loading) {
    return <p className="text-sm text-zinc-400">Loading Company Command Center…</p>;
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
    <div className="space-y-6">
      <CompanyCommandCenterTabs activeTab={tab} />
      <TabPanel tab={tab} data={data} />
      <p className="text-[10px] text-zinc-600">
        ~{Math.round(data.meta.dataFreshnessMs / 1000)}s · Partial: {data.meta.partialData ? "yes" : "no"} · Missing sources:{" "}
        {data.meta.missingSources.length}
        <button type="button" onClick={() => void refetch()} className="ml-2 text-zinc-500 underline hover:text-zinc-400">
          Refresh
        </button>
      </p>
    </div>
  );
}

function TabPanel({ tab, data }: { tab: CommandCenterV2TabId; data: CompanyCommandCenterV2Payload }) {
  switch (tab) {
    case "executive":
      return <ExecutiveTab data={data} />;
    case "growth":
      return <GrowthTab data={data} />;
    case "ranking":
      return <RankingTab data={data} />;
    case "brain":
      return <BrainTab data={data} />;
    case "swarm":
      return <SwarmTab data={data} />;
    case "rollouts":
      return <RolloutsTab data={data} />;
    default:
      return <ExecutiveTab data={data} />;
  }
}
