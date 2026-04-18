import { prisma } from "@/lib/db";
import { AutopilotMode } from "@prisma/client";

/**
 * Auto-send is only allowed when host explicitly enables `autoMessaging` AND mode allows automation.
 * ASSIST / OFF never auto-send.
 */
export async function canSendAutomatedHostMessage(hostUserId: string): Promise<{
  allowed: boolean;
  mode: AutopilotMode;
  autoMessaging: boolean;
}> {
  const s = await prisma.hostAutopilotSettings.findUnique({
    where: { hostId: hostUserId },
    select: { mode: true, autoMessaging: true, paused: true },
  });
  if (!s || s.paused) {
    return { allowed: false, mode: AutopilotMode.OFF, autoMessaging: false };
  }
  const allowed =
    s.autoMessaging === true &&
    (s.mode === AutopilotMode.SAFE_AUTOPILOT || s.mode === AutopilotMode.FULL_AUTOPILOT_APPROVAL);
  return { allowed, mode: s.mode, autoMessaging: s.autoMessaging };
}
