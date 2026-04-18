/**
 * Operational simplicity — scattered command surfaces (advisory).
 */

import type { PlatformOpsReviewResult } from "./platform-improvement.types";
import type { PlatformReviewSnapshot } from "./platform-review-snapshot";
import { getDefaultPlatformReviewSnapshot } from "./platform-review-snapshot";

export function buildPlatformOpsReview(
  snapshot: PlatformReviewSnapshot = getDefaultPlatformReviewSnapshot(),
): PlatformOpsReviewResult {
  const duplicatePanels: string[] = [];
  if (snapshot.growthMissionControlV1 && snapshot.growthFusionV1) {
    duplicatePanels.push("Mission Control and Fusion both surface priorities — cross-link to avoid two “sources of truth”.");
  }
  if (snapshot.growthMachineV1 && snapshot.growthRevenuePanelV1) {
    duplicatePanels.push("Growth Machine dashboard and revenue panel may both show pipeline — align labels.");
  }

  const missingShortcuts: string[] = [
    "Single admin entry from overview to broker acquisition when brokerAcquisitionV1 is on.",
    "Cross-link BNHub host dashboard to booking health when ops flags exist.",
  ];
  if (!snapshot.aiResponseDeskV1) {
    missingShortcuts.push("Response desk off — messaging review queue may be fragmented across CRM pages.");
  }

  const overloadedPages: string[] = [
    "Admin hub navigation is dense — operators rely on search/bookmarks.",
    snapshot.growthMachineV1 ? "Growth Machine dashboard can overload first-time admins with modules." : "",
  ].filter(Boolean);

  const consolidationSuggestions = [
    "Prefer Mission Control as the narrative spine when enabled; link out to executive and governance.",
    "Keep revenue story in one panel (revenue dashboard) and reference it from Growth Machine cards.",
  ];

  const surfaces = [
    {
      surfaceId: "growth_machine_dashboard" as const,
      note: snapshot.growthMachineV1
        ? "Primary GTM command — ensure daily tasks stay above the fold."
        : "Growth Machine off — operators may scatter across legacy growth pages.",
    },
    {
      surfaceId: "bnhub_host_admin",
      note: "BNHub host/admin split — keep payouts and calendar within two clicks.",
    },
    {
      surfaceId: "broker_acquisition",
      note: snapshot.brokerAcquisitionV1
        ? "Broker acquisition on — tie preview metrics to the same numbers sales uses."
        : "Broker acquisition off — consolidate broker stories under CRM until enabled.",
    },
    {
      surfaceId: "revenue_dashboard",
      note: snapshot.growthRevenuePanelV1
        ? "Revenue panel on — use as canonical money snapshot for internal reviews."
        : "Revenue panel off — finance may rely on ad-hoc exports.",
    },
    {
      surfaceId: "mission_control",
      note: snapshot.growthMissionControlV1
        ? "Mission Control on — good rollup; avoid duplicating its bullets in other dashboards."
        : "Mission Control off — operators lack a single daily narrative spine.",
    },
  ];

  return {
    duplicatePanels,
    missingShortcuts,
    overloadedPages,
    consolidationSuggestions,
    surfaces,
  };
}
