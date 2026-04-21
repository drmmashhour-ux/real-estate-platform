import { HubLayout } from "@/components/hub/HubLayout";
import { hubNavigation } from "@/lib/hub/navigation";
import { requireBrokerOrAdminPage } from "@/modules/crm/services/require-broker-page";
import {
  CONTRACTOR_WORK_DISCLAIMER,
  POSITIONING_GREEN_EXECUTION,
} from "@/modules/contractors/contractor.model";
import { matchContractorsForUpgrades } from "@/modules/contractors/contractor.service";
import { GreenProfessionalsClient } from "./green-professionals-client";

export const dynamic = "force-dynamic";

export default async function BrokerGreenProfessionalsPage({
  searchParams,
}: {
  searchParams: Promise<{ region?: string; actions?: string }>;
}) {
  const user = await requireBrokerOrAdminPage("/dashboard/broker/green-professionals");
  const sp = await searchParams;
  const actions = sp.actions?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];
  const region = sp.region?.trim() || "Quebec";

  const match = await matchContractorsForUpgrades({
    upgradeRecommendations: actions,
    region,
    limit: 16,
  });

  return (
    <HubLayout
      title="Green professionals"
      hubKey="broker"
      navigation={hubNavigation.broker}
      showAdminInSwitcher={user.role === "ADMIN"}
    >
      <div className="space-y-6 text-slate-100">
        <div>
          <h2 className="text-lg font-semibold text-white">Execute your upgrades</h2>
          <p className="mt-1 text-sm text-emerald-200/90">{POSITIONING_GREEN_EXECUTION}</p>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Match illustrative Québec contractors to your recommendations. Add{" "}
            <code className="rounded bg-black/40 px-1 text-xs text-emerald-200">?actions=</code> query (comma-separated
            upgrade lines) from tooling or paste engine output.
          </p>
          <p className="mt-3 text-[11px] leading-relaxed text-slate-500">{CONTRACTOR_WORK_DISCLAIMER}</p>
        </div>

        <GreenProfessionalsClient initialContractors={match.contractors} region={region} wantedTags={match.wantedTags} />
      </div>
    </HubLayout>
  );
}
