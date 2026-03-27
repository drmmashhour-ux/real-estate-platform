/**
 * Operational Control Layer – kill switches, feature flags, payout holds,
 * listing freezes, booking restrictions. All actions are audited.
 */
import { prisma } from "@/lib/db";
import type { OperationalControlType, Prisma } from "@prisma/client";

export type { OperationalControlType };

/** Check if a feature flag is enabled (optionally scoped by region). */
export async function isFeatureEnabled(
  key: string,
  context?: { region?: string }
): Promise<boolean> {
  const flag = await prisma.featureFlag.findUnique({
    where: { key },
  });
  if (!flag || !flag.enabled) return false;
  if (flag.scope === "GLOBAL") return true;
  if (flag.scope === "REGION" && flag.scopeValue && context?.region) {
    return flag.scopeValue === context.region;
  }
  return flag.scope === "GLOBAL";
}

/** Set feature flag (admin). Logs to audit. */
export async function setFeatureFlag(
  key: string,
  enabled: boolean,
  options?: { scope?: string; scopeValue?: string; reason?: string; updatedBy?: string }
) {
  const previous = await prisma.featureFlag.findUnique({ where: { key } });
  const flag = await prisma.featureFlag.upsert({
    where: { key },
    create: {
      key,
      enabled,
      scope: options?.scope ?? "GLOBAL",
      scopeValue: options?.scopeValue,
      reason: options?.reason,
      updatedBy: options?.updatedBy,
    },
    update: {
      enabled,
      scope: options?.scope ?? previous?.scope ?? "GLOBAL",
      scopeValue: options?.scopeValue ?? previous?.scopeValue,
      reason: options?.reason,
      updatedBy: options?.updatedBy,
    },
  });
  await prisma.controlActionAuditLog.create({
    data: {
      action: previous ? "UPDATED" : "CREATED",
      performedBy: options?.updatedBy,
      reasonCode: options?.reason ?? undefined,
      previousValue: previous ? { enabled: previous.enabled } : undefined,
      newValue: { enabled: flag.enabled },
    },
  });
  return flag;
}

/** Get all feature flags. */
export async function getAllFeatureFlags() {
  return prisma.featureFlag.findMany({
    orderBy: { key: "asc" },
  });
}

/** Check if an operational control is active for the given target. */
export async function isControlActive(
  controlType: OperationalControlType,
  context: { targetType: string; targetId?: string; region?: string }
): Promise<boolean> {
  const now = new Date();
  const controls = await prisma.operationalControl.findMany({
    where: {
      controlType,
      active: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
  });
  for (const c of controls) {
    if (c.targetType === "GLOBAL") return true;
    if (c.targetType === "REGION" && c.targetId && context.region === c.targetId) return true;
    if (c.targetType === context.targetType && c.targetId === context.targetId) return true;
  }
  return false;
}

/** Get active controls for a given type (and optional target). */
export async function getActiveControls(
  controlType?: OperationalControlType,
  targetType?: string,
  targetId?: string
) {
  const now = new Date();
  const where: Prisma.OperationalControlWhereInput = {
    active: true,
    OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
  };
  if (controlType) where.controlType = controlType;
  if (targetType) where.targetType = targetType;
  if (targetId) where.targetId = targetId;
  return prisma.operationalControl.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
}

/** Create or update operational control. Logs to audit. */
export async function setOperationalControl(
  data: {
    controlType: OperationalControlType;
    targetType: string;
    targetId?: string | null;
    payload?: object | null;
    active: boolean;
    reason?: string | null;
    reasonCode?: string | null;
    createdBy?: string | null;
    expiresAt?: Date | null;
  }
) {
  const existing = await prisma.operationalControl.findFirst({
    where: {
      controlType: data.controlType,
      targetType: data.targetType,
      targetId: data.targetId ?? null,
    },
  });
  const control = existing
    ? await prisma.operationalControl.update({
        where: { id: existing.id },
        data: {
          payload: (data.payload as object) ?? undefined,
          active: data.active,
          reason: data.reason,
          reasonCode: data.reasonCode,
          expiresAt: data.expiresAt,
        },
      })
    : await prisma.operationalControl.create({
        data: {
          controlType: data.controlType,
          targetType: data.targetType,
          targetId: data.targetId,
          payload: (data.payload as object) ?? undefined,
          active: data.active,
          reason: data.reason,
          reasonCode: data.reasonCode,
          createdBy: data.createdBy,
          expiresAt: data.expiresAt,
        },
      });
  await prisma.controlActionAuditLog.create({
    data: {
      controlId: control.id,
      action: existing ? (data.active ? "ACTIVATED" : "DEACTIVATED") : "CREATED",
      performedBy: data.createdBy,
      reasonCode: data.reasonCode ?? undefined,
      newValue: { active: control.active, payload: control.payload },
    },
  });
  return control;
}

/** Payout hold: check if payouts are held for user or region. */
export async function isPayoutHeldFor(context: { userId?: string; region?: string }): Promise<boolean> {
  return isControlActive("PAYOUT_HOLD", {
    targetType: context.userId ? "USER" : "REGION",
    targetId: context.userId ?? context.region,
    region: context.region,
  });
}

/** Listing freeze: check if listings are frozen for owner or category/region. */
export async function isListingFrozenFor(context: {
  userId?: string;
  region?: string;
  category?: string;
}): Promise<boolean> {
  if (context.userId) {
    const held = await isControlActive("LISTING_FREEZE", { targetType: "USER", targetId: context.userId });
    if (held) return true;
  }
  if (context.region) {
    const held = await isControlActive("LISTING_FREEZE", { targetType: "REGION", targetId: context.region, region: context.region });
    if (held) return true;
  }
  if (context.category) {
    const held = await isControlActive("LISTING_FREEZE", { targetType: "LISTING_CATEGORY", targetId: context.category });
    if (held) return true;
  }
  return false;
}

/** Booking restriction: check if new bookings are restricted for listing/region. */
export async function isBookingRestrictedFor(context: { listingId?: string; region?: string }): Promise<boolean> {
  return isControlActive("BOOKING_RESTRICTION", {
    targetType: context.listingId ? "LISTING" : "REGION",
    targetId: context.listingId ?? context.region,
    region: context.region,
  });
}

/** Get recent control audit log. */
export async function getControlAuditLog(limit = 50) {
  return prisma.controlActionAuditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
