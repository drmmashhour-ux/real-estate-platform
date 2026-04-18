import { engineFlags } from "@/config/feature-flags";

/** COPY + share links are always available when distribution flag is on. API outbound posts stay off unless explicitly enabled. */
export type DistributionModeId = "COPY" | "SHARE_LINKS" | "API";

export function getDistributionModes(): { modes: DistributionModeId[]; apiOutboundEnabled: boolean } {
  const apiOutboundEnabled = engineFlags.distributionV1 && engineFlags.distributionApiV1;
  return {
    modes: ["COPY", "SHARE_LINKS", ...(apiOutboundEnabled ? (["API"] as const) : [])],
    apiOutboundEnabled,
  };
}
