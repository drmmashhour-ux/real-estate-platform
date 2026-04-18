import { intelligenceFlags } from "@/config/feature-flags";
import type { LogIntelligenceEventInput } from "./event.types";
import { logIntelligenceEvent } from "./event.logger";
import { maybeRunAutopilotV2FromEvent } from "@/src/modules/autopilot/v2/autopilot.engine";

/**
 * Log event + optional downstream processing (autopilot v2 fan-out).
 */
export async function processIntelligenceEvent(input: LogIntelligenceEventInput): Promise<{ eventId: string | null }> {
  const eventId = await logIntelligenceEvent(input);

  if (intelligenceFlags.autopilotV2 && input.listingId) {
    void maybeRunAutopilotV2FromEvent({
      type: input.type,
      listingId: input.listingId,
      userId: input.userId ?? null,
      payload: input.payload,
      eventId,
    }).catch(() => {});
  }

  return { eventId };
}
