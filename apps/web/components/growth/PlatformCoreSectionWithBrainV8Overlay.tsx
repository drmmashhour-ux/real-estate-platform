import type { ProviderConfigHealth } from "@/modules/operator/provider-sync/provider-config.service";
import { loadPlatformCoreDashboardPayloadWithBrainV8Overlay } from "@/modules/platform-core/platform-history.service";
import { PlatformCoreSectionClient } from "./PlatformCoreSectionClient";

/**
 * Opt-in Growth / Platform Core block: brain slice uses Brain V8 Phase C/D routing via
 * {@link loadPlatformCoreDashboardPayloadWithBrainV8Overlay}.
 * For legacy snapshot-only behavior use {@link PlatformCoreSection}.
 */
export async function PlatformCoreSectionWithBrainV8Overlay({
  canApprove,
  canExecute,
  canMutate,
  operatorProviderHealth,
}: {
  canApprove: boolean;
  canExecute: boolean;
  canMutate: boolean;
  operatorProviderHealth?: ProviderConfigHealth | null;
}) {
  const data = await loadPlatformCoreDashboardPayloadWithBrainV8Overlay();
  return (
    <div id="lecipm-platform-core">
      <PlatformCoreSectionClient
        data={data}
        canApprove={canApprove}
        canExecute={canExecute}
        canMutate={canMutate}
        operatorProviderHealth={operatorProviderHealth ?? null}
        brainRefreshMode="v8_overlay"
      />
    </div>
  );
}
