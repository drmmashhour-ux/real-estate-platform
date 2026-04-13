import { prisma } from "@/lib/db";
import {
  GUEST_MESSAGE_TRIGGER_KEYS,
  mergeGuestMessageTriggers,
  type GuestMessageTriggersState,
} from "@/lib/ai/messaging/trigger-config";

export const HOST_AUTOPILOT_MODES = ["OFF", "ASSIST", "SAFE_AUTOPILOT", "FULL_AUTOPILOT_APPROVAL"] as const;
export type HostAutopilotMode = (typeof HOST_AUTOPILOT_MODES)[number];

export type GuestMessageMode = "draft_only" | "auto_send_safe";

export type HostAutopilotPreferences = {
  autoPricing: boolean;
  autoMessaging: boolean;
  autoPromotions: boolean;
  autoListingOptimization: boolean;
};

export type HostAutopilotConfig = {
  userId: string;
  autopilotEnabled: boolean;
  autopilotMode: HostAutopilotMode;
  preferences: HostAutopilotPreferences;
  lastAutopilotRunAt: Date | null;
  /** BNHUB: host-controlled guest lifecycle messaging (separate from generic “message drafts”). */
  guestMessaging: {
    autoGuestMessagingEnabled: boolean;
    guestMessageMode: GuestMessageMode;
    triggers: GuestMessageTriggersState;
    hostInternalChecklistEnabled: boolean;
  };
};

export const DEFAULT_HOST_AUTOPILOT_PREFERENCES: HostAutopilotPreferences = {
  autoPricing: false,
  autoMessaging: false,
  autoPromotions: false,
  autoListingOptimization: false,
};

export function parseHostAutopilotMode(raw: string | null | undefined): HostAutopilotMode {
  const s = (raw ?? "OFF").trim().toUpperCase();
  if (s === "OFF" || s === "ASSIST" || s === "SAFE_AUTOPILOT" || s === "FULL_AUTOPILOT_APPROVAL") {
    return s as HostAutopilotMode;
  }
  return "OFF";
}

function parseGuestMessageMode(raw: string | null | undefined): GuestMessageMode {
  const s = (raw ?? "draft_only").trim().toLowerCase();
  return s === "auto_send_safe" ? "auto_send_safe" : "draft_only";
}

function rowToConfig(row: {
  userId: string;
  autopilotEnabled: boolean;
  autopilotMode: string;
  autoPricing: boolean;
  autoMessaging: boolean;
  autoPromotions: boolean;
  autoListingOptimization: boolean;
  lastAutopilotRunAt: Date | null;
  autoGuestMessagingEnabled: boolean;
  guestMessageMode: string;
  guestMessageTriggersJson: unknown;
  hostInternalChecklistEnabled: boolean;
}): HostAutopilotConfig {
  return {
    userId: row.userId,
    autopilotEnabled: row.autopilotEnabled,
    autopilotMode: parseHostAutopilotMode(row.autopilotMode),
    preferences: {
      autoPricing: row.autoPricing,
      autoMessaging: row.autoMessaging,
      autoPromotions: row.autoPromotions,
      autoListingOptimization: row.autoListingOptimization,
    },
    lastAutopilotRunAt: row.lastAutopilotRunAt,
    guestMessaging: {
      autoGuestMessagingEnabled: row.autoGuestMessagingEnabled,
      guestMessageMode: parseGuestMessageMode(row.guestMessageMode),
      triggers: mergeGuestMessageTriggers(row.guestMessageTriggersJson),
      hostInternalChecklistEnabled: row.hostInternalChecklistEnabled,
    },
  };
}

export async function getHostAutopilotConfig(userId: string): Promise<HostAutopilotConfig> {
  const row = await prisma.managerAiHostAutopilotSettings.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
  return rowToConfig(row);
}

export async function updateHostAutopilotConfig(
  userId: string,
  patch: Partial<{
    autopilotEnabled: boolean;
    autopilotMode: HostAutopilotMode;
    autoPricing: boolean;
    autoMessaging: boolean;
    autoPromotions: boolean;
    autoListingOptimization: boolean;
    autoGuestMessagingEnabled: boolean;
    guestMessageMode: GuestMessageMode;
    guestMessageTriggers: Partial<GuestMessageTriggersState>;
    hostInternalChecklistEnabled: boolean;
  }>
): Promise<HostAutopilotConfig> {
  const mode = patch.autopilotMode != null ? parseHostAutopilotMode(patch.autopilotMode) : undefined;

  let mergedTriggersJson: object | undefined;
  if (patch.guestMessageTriggers != null) {
    const current = await prisma.managerAiHostAutopilotSettings.findUnique({
      where: { userId },
      select: { guestMessageTriggersJson: true },
    });
    const base = mergeGuestMessageTriggers(current?.guestMessageTriggersJson);
    for (const k of GUEST_MESSAGE_TRIGGER_KEYS) {
      const v = patch.guestMessageTriggers[k];
      if (v && typeof v.enabled === "boolean") {
        base[k] = { enabled: v.enabled };
      }
    }
    mergedTriggersJson = base as object;
  }

  const row = await prisma.managerAiHostAutopilotSettings.upsert({
    where: { userId },
    create: {
      userId,
      ...(patch.autopilotEnabled != null ? { autopilotEnabled: patch.autopilotEnabled } : {}),
      ...(mode != null ? { autopilotMode: mode } : {}),
      ...(patch.autoPricing != null ? { autoPricing: patch.autoPricing } : {}),
      ...(patch.autoMessaging != null ? { autoMessaging: patch.autoMessaging } : {}),
      ...(patch.autoPromotions != null ? { autoPromotions: patch.autoPromotions } : {}),
      ...(patch.autoListingOptimization != null ? { autoListingOptimization: patch.autoListingOptimization } : {}),
      ...(patch.autoGuestMessagingEnabled != null
        ? { autoGuestMessagingEnabled: patch.autoGuestMessagingEnabled }
        : {}),
      ...(patch.guestMessageMode != null ? { guestMessageMode: patch.guestMessageMode } : {}),
      ...(mergedTriggersJson != null ? { guestMessageTriggersJson: mergedTriggersJson } : {}),
      ...(patch.hostInternalChecklistEnabled != null
        ? { hostInternalChecklistEnabled: patch.hostInternalChecklistEnabled }
        : {}),
    },
    update: {
      ...(patch.autopilotEnabled != null ? { autopilotEnabled: patch.autopilotEnabled } : {}),
      ...(mode != null ? { autopilotMode: mode } : {}),
      ...(patch.autoPricing != null ? { autoPricing: patch.autoPricing } : {}),
      ...(patch.autoMessaging != null ? { autoMessaging: patch.autoMessaging } : {}),
      ...(patch.autoPromotions != null ? { autoPromotions: patch.autoPromotions } : {}),
      ...(patch.autoListingOptimization != null ? { autoListingOptimization: patch.autoListingOptimization } : {}),
      ...(patch.autoGuestMessagingEnabled != null
        ? { autoGuestMessagingEnabled: patch.autoGuestMessagingEnabled }
        : {}),
      ...(patch.guestMessageMode != null ? { guestMessageMode: patch.guestMessageMode } : {}),
      ...(mergedTriggersJson != null ? { guestMessageTriggersJson: mergedTriggersJson } : {}),
      ...(patch.hostInternalChecklistEnabled != null
        ? { hostInternalChecklistEnabled: patch.hostInternalChecklistEnabled }
        : {}),
    },
  });
  return rowToConfig(row);
}

export async function touchHostAutopilotRun(userId: string): Promise<void> {
  await prisma.managerAiHostAutopilotSettings.update({
    where: { userId },
    data: { lastAutopilotRunAt: new Date() },
  });
}

/**
 * How the engine should treat a **non-financial** side effect (e.g. listing copy).
 * - ASSIST: suggestions only
 * - SAFE_AUTOPILOT: may auto-apply safe listing copy when preference on
 * - FULL_AUTOPILOT_APPROVAL: queue approval before any write
 */
export function listingWriteDecision(mode: HostAutopilotMode): "none" | "suggest" | "auto_safe" | "approval" {
  switch (mode) {
    case "OFF":
      return "none";
    case "ASSIST":
      return "suggest";
    case "SAFE_AUTOPILOT":
      return "auto_safe";
    case "FULL_AUTOPILOT_APPROVAL":
      return "approval";
    default:
      return "none";
  }
}

export function pricingDecision(mode: HostAutopilotMode): "none" | "suggest" | "approval" {
  if (mode === "OFF") return "none";
  if (mode === "ASSIST") return "suggest";
  /* Never auto-apply price from engine — suggest or require approval */
  if (mode === "SAFE_AUTOPILOT") return "suggest";
  return "approval";
}
