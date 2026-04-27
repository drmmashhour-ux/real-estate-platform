import "server-only";

import { flags } from "@/lib/flags";
import { getLegacyDB } from "@/lib/db/legacy";
import { isLaunchReady } from "@/lib/launch/readiness";
import { runLaunchAudit } from "@/lib/launch/readinessAudit";
import { computeCurrentDayFromStart } from "@/lib/launch/launchDayPhase";
import { trackEvent } from "@/src/services/analytics";

export { computeCurrentDayFromStart } from "@/lib/launch/launchDayPhase";

const db = getLegacyDB();

export type LaunchStatus = "idle" | "running" | "completed";

export type PublicLaunchStatus = {
  status: LaunchStatus;
  startedAt: Date | null;
  currentDay: number;
};

/**
 * One-click launch: sets global run to `running`.
 * Ops expectations (all safe in this layer — no env mutation, no spend, no listing/campaign writes):
 * - Early-user urgency: already live when configured in product; not toggled by DB here.
 * - Growth Brain: consumers read this row via `isPlatformLaunchRunning` / `getLaunchStatus` for ordering + UI.
 * - Campaign “optimizer visibility”: surfaced in admin/analytics; no auto-apply to live campaigns.
 */
export async function startLaunch(): Promise<
  | { ok: true }
  | { ok: false; error: string; code: "disabled" | "busy" }
  | { ok: false; error: string; code: "not_ready"; reasons: string[] }
> {
  if (!flags.AUTONOMOUS_AGENT) {
    return { ok: false, error: "Autonomous / launch control is disabled.", code: "disabled" };
  }
  const audit = await runLaunchAudit();
  if (!audit.criticalPass) {
    const failed = audit.items.filter(
      (i) => i.status === "fail" && ["db_overlap", "exclusion_constraint", "booking_api_path"].includes(i.id)
    );
    let lines: string[] = failed.map((i) => `${i.label}: ${i.details ?? "failed"}`);
    if (lines.length === 0) {
      lines = [
        "Critical launch readiness checks did not all pass. See /dashboard/admin/launch-readiness.",
      ];
    }
    return {
      ok: false,
      error: "Platform not ready for launch",
      code: "not_ready",
      reasons: lines,
    };
  }
  const ready = await isLaunchReady();
  if (!ready.ready) {
    return { ok: false, error: "Platform not ready for launch", code: "not_ready", reasons: ready.reasons };
  }
  const open = await db.launchState.findFirst({
    where: { status: "running" },
    orderBy: { createdAt: "desc" },
  });
  if (open) {
    return { ok: false, error: "A launch is already running. Stop it before starting again.", code: "busy" };
  }
  const at = new Date();
  await db.launchState.create({
    data: { status: "running", startedAt: at },
  });
  void trackEvent("launch_started", { at: at.toISOString() }).catch(() => {});
  return { ok: true };
}

/**
 * Public launch signal for UI + growth — latest row wins. No rows ⇒ idle.
 */
export async function getLaunchStatus(): Promise<PublicLaunchStatus> {
  const row = await db.launchState.findFirst({ orderBy: { createdAt: "desc" } });
  if (!row) {
    return { status: "idle", startedAt: null, currentDay: 1 };
  }
  if (row.status === "running" && row.startedAt) {
    return {
      status: "running",
      startedAt: row.startedAt,
      currentDay: computeCurrentDayFromStart(row.startedAt),
    };
  }
  if (row.status === "completed") {
    return {
      status: "completed",
      startedAt: row.startedAt,
      currentDay: 7,
    };
  }
  return { status: "idle", startedAt: null, currentDay: 1 };
}

export async function isPlatformLaunchRunning(): Promise<boolean> {
  const s = await getLaunchStatus();
  return s.status === "running";
}

export async function stopLaunch(): Promise<
  { ok: true } | { ok: false; error: string; code: "disabled" | "idle" }
> {
  if (!flags.AUTONOMOUS_AGENT) {
    return { ok: false, error: "Autonomous / launch control is disabled.", code: "disabled" };
  }
  const run = await db.launchState.findFirst({
    where: { status: "running" },
    orderBy: { createdAt: "desc" },
  });
  if (!run) {
    return { ok: false, error: "No active launch to stop.", code: "idle" };
  }
  await db.launchState.update({
    where: { id: run.id },
    data: { status: "completed" },
  });
  void trackEvent("launch_stopped", { launchId: run.id }).catch(() => {});
  return { ok: true };
}
