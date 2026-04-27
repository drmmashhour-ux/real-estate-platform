import { revalidatePath } from "next/cache";
import { getAdminUser, requireAdmin } from "@/lib/auth";
import { appendSyriaSybnbCoreAudit } from "@/lib/sybnb/sybnb-financial-audit";

export type DrBrainMaintenanceAction =
  | "CLEAR_CACHE"
  | "RESTART_JOBS"
  | "ENABLE_STRICT_FRAUD"
  | "DISABLE_PAYMENTS"
  | "RECHECK_SYSTEM";

export type DrBrainMaintenanceResult =
  | { ok: true; message: string; action: DrBrainMaintenanceAction }
  | { ok: false; message: string; action?: DrBrainMaintenanceAction };

const ADMIN_LOCALES = ["ar", "en"] as const;

/**
 * Admin-only maintenance helpers — audit-logged, no DB deletes, no payout releases.
 * Kill-switch changes apply to this Node process only (not persisted to hosting env files).
 */
export async function runDrBrainMaintenanceAction(input: {
  action: DrBrainMaintenanceAction;
  actorId: string;
}): Promise<DrBrainMaintenanceResult> {
  const admin = await getAdminUser();
  if (!admin || admin.id !== input.actorId) {
    return { ok: false, message: "Admin session required." };
  }

  const meta = { actorId: admin.id, action: input.action };

  switch (input.action) {
    case "CLEAR_CACHE": {
      for (const loc of ADMIN_LOCALES) {
        revalidatePath(`/${loc}`);
        revalidatePath(`/${loc}/admin`);
        revalidatePath(`/${loc}/admin/dr-brain`);
      }
      await appendSyriaSybnbCoreAudit({
        bookingId: null,
        event: "DRBRAIN_MAINTENANCE_CLEAR_CACHE",
        metadata: meta,
      });
      return {
        ok: true,
        action: input.action,
        message: "Cache tags invalidated for core Syria routes — refresh pages to reload.",
      };
    }
    case "RESTART_JOBS": {
      await appendSyriaSybnbCoreAudit({
        bookingId: null,
        event: "DRBRAIN_MAINTENANCE_RESTART_JOBS_REQUEST",
        metadata: meta,
      });
      return {
        ok: true,
        action: input.action,
        message:
          "Recorded restart request — no distributed job runner is wired in this deployment; operators restart workers via infra.",
      };
    }
    case "ENABLE_STRICT_FRAUD": {
      process.env.SYBNB_COMPLIANCE_MODE = "strict";
      await appendSyriaSybnbCoreAudit({
        bookingId: null,
        event: "DRBRAIN_MAINTENANCE_STRICT_COMPLIANCE",
        metadata: meta,
      });
      return {
        ok: true,
        action: input.action,
        message:
          "Strict compliance mode applied for this runtime process only — redeploy or env change needed for persistence.",
      };
    }
    case "DISABLE_PAYMENTS": {
      process.env.SYBNB_PAYMENTS_KILL_SWITCH = "true";
      process.env.SYBNB_PAYOUTS_KILL_SWITCH = "true";
      await appendSyriaSybnbCoreAudit({
        bookingId: null,
        event: "DRBRAIN_MAINTENANCE_KILL_SWITCH_MANUAL",
        metadata: meta,
      });
      return {
        ok: true,
        action: input.action,
        message:
          "Payments and payout transitions blocked via runtime kill switches for this process — configure SYBNB_*_KILL_SWITCH in hosting env for durability.",
      };
    }
    case "RECHECK_SYSTEM": {
      await appendSyriaSybnbCoreAudit({
        bookingId: null,
        event: "DRBRAIN_MAINTENANCE_RECHECK_REQUESTED",
        metadata: meta,
      });
      return {
        ok: true,
        action: input.action,
        message: "Recheck logged — reload this page to refresh DR.BRAIN results.",
      };
    }
  }
}

/**
 * Resolves the actor with {@link requireAdmin} (redirects when unauthorized).
 * Route handlers should continue using {@link getAdminUser} + {@link runDrBrainMaintenanceAction}.
 */
export async function runDrBrainMaintenanceActionWithRequireAdmin(
  action: DrBrainMaintenanceAction,
): Promise<DrBrainMaintenanceResult> {
  const admin = await requireAdmin();
  return runDrBrainMaintenanceAction({ action, actorId: admin.id });
}
