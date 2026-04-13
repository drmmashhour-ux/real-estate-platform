import type { LecipmBrokerAutopilotMode } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getOrCreateBrokerAutopilotSettings } from "@/lib/broker-autopilot/get-settings";

export async function updateBrokerAutopilotSettings(
  brokerUserId: string,
  patch: {
    mode?: LecipmBrokerAutopilotMode;
    autoDraftFollowups?: boolean;
    autoSuggestVisits?: boolean;
    autoPrioritizeHotLeads?: boolean;
    dailyDigestEnabled?: boolean;
    pauseUntil?: Date | null;
  }
) {
  await getOrCreateBrokerAutopilotSettings(brokerUserId);
  return prisma.lecipmBrokerAutopilotSetting.update({
    where: { brokerUserId },
    data: {
      ...(patch.mode !== undefined ? { mode: patch.mode } : {}),
      ...(patch.autoDraftFollowups !== undefined ? { autoDraftFollowups: patch.autoDraftFollowups } : {}),
      ...(patch.autoSuggestVisits !== undefined ? { autoSuggestVisits: patch.autoSuggestVisits } : {}),
      ...(patch.autoPrioritizeHotLeads !== undefined ? { autoPrioritizeHotLeads: patch.autoPrioritizeHotLeads } : {}),
      ...(patch.dailyDigestEnabled !== undefined ? { dailyDigestEnabled: patch.dailyDigestEnabled } : {}),
      ...(patch.pauseUntil !== undefined ? { pauseUntil: patch.pauseUntil } : {}),
    },
  });
}
