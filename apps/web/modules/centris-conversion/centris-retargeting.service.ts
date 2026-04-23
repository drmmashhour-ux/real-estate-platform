import { recordLeadFunnelEvent } from "./lead-timeline.service";
import { logConversion } from "./centris-funnel.log";

export type CentrisRetargetKind = "saved_listing" | "price_alert" | "revisit_reminder";

/**
 * Hooks growth / lifecycle signals into the existing Lead timeline (no duplicate CRM rows).
 */
export async function recordCentrisRetargetingSignal(
  leadId: string,
  kind: CentrisRetargetKind,
  meta?: Record<string, unknown>,
): Promise<void> {
  await recordLeadFunnelEvent(
    leadId,
    "SAVE",
    {
      channel: "CENTRIS",
      retargetKind: kind,
      ...(meta ?? {}),
    },
  );
  logConversion("retarget_signal", { leadId, kind });
}
