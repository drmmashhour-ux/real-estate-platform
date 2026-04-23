import type { AutonomyUiDomainId } from "./autonomy-command-center.groups";
import { AUTONOMY_UI_DOMAIN_GROUPS } from "./autonomy-command-center.groups";
import type { DomainMatrixUiSlot } from "./autonomy-command-center.pure";
import { persistedModeForUiSlot } from "./autonomy-command-center.pure";
import {
  getDomainMatrixRow,
  normalizePersistedMode,
} from "@/modules/autopilot-governance/autopilot-domain-matrix.service";
import type { FullAutopilotMode } from "@/modules/autopilot-governance/autopilot-domain-matrix.types";
import { setDomainKillSwitch } from "@/modules/autopilot-governance/autopilot-kill-switch.service";
import { setDomainMode } from "@/modules/autopilot-governance/autopilot-domain-mode.service";
import { prisma } from "@/lib/db";

async function technicalFallback(domain: Parameters<typeof getDomainMatrixRow>[0]): Promise<FullAutopilotMode> {
  const row = await prisma.lecipmFullAutopilotDomainConfig.findUnique({ where: { domainId: domain } });
  const def = getDomainMatrixRow(domain)?.defaultMode ?? "ASSIST";
  return normalizePersistedMode(row?.mode ?? def);
}

/** Applies a UX slot across every technical lane in an executive grouping. */
export async function applyUiDomainSlot(params: {
  actorUserId: string;
  uiDomainId: AutonomyUiDomainId;
  slot: DomainMatrixUiSlot;
  reason?: string;
}): Promise<void> {
  const group = AUTONOMY_UI_DOMAIN_GROUPS.find((g) => g.id === params.uiDomainId);
  if (!group) throw new Error("unknown_ui_domain");

  const reason =
    params.reason ??
    `autonomy_command_center_domain_${params.uiDomainId}_${params.slot}`;

  for (const domain of group.domainIds) {
    const fb = await technicalFallback(domain);
    const mode = persistedModeForUiSlot(params.slot, domain, fb);
    await setDomainMode({
      domain,
      mode,
      actorUserId: params.actorUserId,
      reason,
    });
  }
}

/** Kill-switch OFF for each lane in group (maximum halt). */
export async function killUiDomainGroup(actorUserId: string, uiDomainId: AutonomyUiDomainId): Promise<void> {
  const group = AUTONOMY_UI_DOMAIN_GROUPS.find((g) => g.id === uiDomainId);
  if (!group) throw new Error("unknown_ui_domain");

  for (const domain of group.domainIds) {
    await setDomainKillSwitch({
      domain,
      position: "OFF",
      actorUserId,
      reason: `autonomy_command_center_kill_${uiDomainId}`,
    });
  }
}

/** Restore kill switch ON per lane after review. */
export async function reviveUiDomainGroup(actorUserId: string, uiDomainId: AutonomyUiDomainId): Promise<void> {
  const group = AUTONOMY_UI_DOMAIN_GROUPS.find((g) => g.id === uiDomainId);
  if (!group) throw new Error("unknown_ui_domain");

  for (const domain of group.domainIds) {
    await setDomainKillSwitch({
      domain,
      position: "ON",
      actorUserId,
      reason: `autonomy_command_center_revive_${uiDomainId}`,
    });
  }
}
