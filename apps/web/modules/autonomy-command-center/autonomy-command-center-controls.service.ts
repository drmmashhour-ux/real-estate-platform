import { recordAuditEvent } from "@/modules/analytics/audit-log.service";
import { listDomainMatrix } from "@/modules/autopilot-governance/autopilot-domain-matrix.service";
import type { FullAutopilotMode } from "@/modules/autopilot-governance/autopilot-domain-matrix.types";
import type { LecipmAutopilotDomainId } from "@/modules/autopilot-governance/autopilot-domain-matrix.types";
import { setDomainKillSwitch } from "@/modules/autopilot-governance/autopilot-kill-switch.service";
import { setDomainMode } from "@/modules/autopilot-governance/autopilot-domain-mode.service";
import { setGlobalAutopilotPause } from "@/modules/autopilot-governance/autopilot-global-pause.service";
import { recommendDomainModes } from "@/modules/autopilot-governance/autopilot-recommended-mode.service";
import { evaluateAutopilotAlerts } from "@/modules/autopilot-alerts/autopilot-alerts.service";

import { modeForQuickSwitch, type QuickOperatingMode } from "./autonomy-command-center.pure";

async function eachDomain(fn: (d: LecipmAutopilotDomainId) => Promise<void>): Promise<void> {
  const domains = listDomainMatrix().map((r) => r.domain);
  for (const d of domains) {
    await fn(d);
  }
}

export async function pauseAllAutonomy(actorUserId: string, paused: boolean): Promise<void> {
  await setGlobalAutopilotPause({
    paused,
    actorUserId,
    reason: paused ? "autonomy_command_center_pause_all" : "autonomy_command_center_resume_all",
  });
}

/**
 * Emergency: global pause + kill switches OFF on every domain (maximum halt).
 */
export async function emergencyKillAll(actorUserId: string): Promise<void> {
  await setGlobalAutopilotPause({
    paused: true,
    actorUserId,
    reason: "autonomy_command_center_emergency_kill",
  });
  await eachDomain((domain) =>
    setDomainKillSwitch({
      domain,
      position: "OFF",
      actorUserId,
      reason: "autonomy_command_center_emergency_kill",
    })
  );
}

export async function applyQuickOperatingMode(actorUserId: string, quick: QuickOperatingMode): Promise<void> {
  await eachDomain(async (domain) => {
    const row = listDomainMatrix().find((r) => r.domain === domain);
    const fb = row?.defaultMode ?? ("ASSIST" as FullAutopilotMode);
    const mode = modeForQuickSwitch(quick, domain, fb);
    await setDomainMode({
      domain,
      mode,
      actorUserId,
      reason: `autonomy_command_center_quick_mode_${quick}`,
    });
  });
}

/** Invalidates cached alert evaluation by recomputing advisory alerts (lightweight refresh). */
export async function forceRecomputeAutonomySignals(): Promise<{ alertsEvaluated: number }> {
  const pack = await evaluateAutopilotAlerts();
  await recommendDomainModes().catch(() => null);
  return { alertsEvaluated: pack.alerts.length };
}

export async function recordLearningResetIntent(actorUserId: string): Promise<void> {
  await recordAuditEvent({
    actorUserId,
    action: "AUTONOMY_LEARNING_RESET_REQUESTED",
    payload: {
      scope: "platform",
      note: "Operator requested learning reset — execute only via approved backend workflow.",
    },
  });
}
