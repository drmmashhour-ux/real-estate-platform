import type { ProviderConfigHealth } from "@/modules/operator/provider-sync/provider-config.service";
import { loadPlatformCoreDashboardPayload } from "@/modules/platform-core/platform-history.service";
import { PlatformCoreSectionClient } from "./PlatformCoreSectionClient";

export async function PlatformCoreSection({
  canApprove,
  canExecute,
  canMutate,
  operatorProviderHealth,
}: {
  canApprove: boolean;
  canExecute: boolean;
  canMutate: boolean;
  /** Env-only Meta/Google readiness for Operator V2 — no secrets */
  operatorProviderHealth?: ProviderConfigHealth | null;
}) {
  const data = await loadPlatformCoreDashboardPayload();
  return (
    <div id="lecipm-platform-core">
      <PlatformCoreSectionClient
        data={data}
        canApprove={canApprove}
        canExecute={canExecute}
        canMutate={canMutate}
        operatorProviderHealth={operatorProviderHealth ?? null}
      />
    </div>
  );
}
