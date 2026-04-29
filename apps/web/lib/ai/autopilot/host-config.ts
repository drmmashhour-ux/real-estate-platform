import "server-only";

import type { GuestMessageTriggersState } from "@/lib/ai/messaging/trigger-config";
import { GUEST_MESSAGE_TRIGGER_KEYS } from "@/lib/ai/messaging/trigger-config";
import { prisma } from "@/lib/db";
import {
  AutopilotMode,
  type HostAutopilotSettings,
  type ManagerAiHostAutopilotSettings,
  type Prisma,
} from "@prisma/client";

export type HostAutopilotMode = "OFF" | "ASSIST" | "SAFE_AUTOPILOT" | "FULL_AUTOPILOT_APPROVAL";

export type HostAutopilotConfig = {
  userId: string;
  autopilotEnabled: boolean;
  autopilotMode: HostAutopilotMode;
  preferences: {
    autoPricing: boolean;
    autoMessaging: boolean;
    autoPromotions: boolean;
    autoListingOptimization: boolean;
  };
  lastAutopilotRunAt: string | null;
  guestMessaging: {
    autoGuestMessagingEnabled: boolean;
    guestMessageMode: "draft_only" | "auto_send_safe";
    triggers: GuestMessageTriggersState;
    hostInternalChecklistEnabled: boolean;
  };
};

export type UpdateHostAutopilotConfigInput = Partial<{
  autopilotEnabled: boolean;
  autopilotMode: HostAutopilotMode;
  autoPricing: boolean;
  autoMessaging: boolean;
  autoPromotions: boolean;
  autoListingOptimization: boolean;
  autoGuestMessagingEnabled: boolean;
  guestMessageMode: "draft_only" | "auto_send_safe";
  hostInternalChecklistEnabled: boolean;
  guestMessageTriggers: Partial<GuestMessageTriggersState>;
}>;

const MODE_TO_PRISMA: Record<HostAutopilotMode, AutopilotMode> = {
  OFF: AutopilotMode.OFF,
  ASSIST: AutopilotMode.ASSIST,
  SAFE_AUTOPILOT: AutopilotMode.SAFE_AUTOPILOT,
  FULL_AUTOPILOT_APPROVAL: AutopilotMode.FULL_AUTOPILOT_APPROVAL,
};

function prismaModeToHost(mode: AutopilotMode): HostAutopilotMode {
  return String(mode) as HostAutopilotMode;
}

function defaultGuestTriggers(): GuestMessageTriggersState {
  return Object.fromEntries(
    GUEST_MESSAGE_TRIGGER_KEYS.map((k) => [k, { enabled: false }])
  ) as GuestMessageTriggersState;
}

function normalizeTriggers(raw: unknown): GuestMessageTriggersState {
  const base = defaultGuestTriggers();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return base;
  }
  const o = raw as Record<string, unknown>;
  for (const key of GUEST_MESSAGE_TRIGGER_KEYS) {
    const v = o[key];
    if (
      v &&
      typeof v === "object" &&
      !Array.isArray(v) &&
      typeof (v as { enabled?: unknown }).enabled === "boolean"
    ) {
      base[key] = { enabled: (v as { enabled: boolean }).enabled };
    }
  }
  return base;
}

async function ensureBnhub(hostId: string) {
  let row = await prisma.hostAutopilotSettings.findUnique({ where: { hostId } });
  if (!row) {
    row = await prisma.hostAutopilotSettings.create({ data: { hostId } });
  }
  return row;
}

async function ensureManager(hostId: string, bnhub: Awaited<ReturnType<typeof ensureBnhub>>) {
  let m = await prisma.managerAiHostAutopilotSettings.findUnique({ where: { userId: hostId } });
  if (!m) {
    m = await prisma.managerAiHostAutopilotSettings.create({
      data: {
        userId: hostId,
        autopilotEnabled: !bnhub.paused && bnhub.mode !== AutopilotMode.OFF,
        autopilotMode:
          bnhub.mode === AutopilotMode.OFF ? "OFF" : String(bnhub.mode),
        autoPricing: bnhub.autoPricing,
        autoMessaging: bnhub.autoMessaging,
        autoPromotions: bnhub.autoPromotions,
        autoListingOptimization: bnhub.autoListingOptimization,
      },
    });
  }
  return m;
}

export function mergeGuestTriggersJson(
  currentJson: unknown,
  patch?: Partial<GuestMessageTriggersState>
): GuestMessageTriggersState {
  const cur = normalizeTriggers(currentJson);
  if (!patch) return cur;
  const next = { ...cur };
  for (const k of Object.keys(patch) as (keyof GuestMessageTriggersState)[]) {
    const p = patch[k];
    if (p && typeof p.enabled === "boolean" && k in next) {
      next[k] = { enabled: p.enabled };
    }
  }
  return next;
}

export function toHostAutopilotConfig(
  userId: string,
  bnhub: Prisma.HostAutopilotSettingsGetPayload<{ select: { [K in keyof Prisma.HostAutopilotSettingsScalarFieldEnum]: true } }>,
  manager: Prisma.ManagerAiHostAutopilotSettingsGetPayload<{
    select: { [K in keyof Prisma.ManagerAiHostAutopilotSettingsScalarFieldEnum]: true };
  }>
): HostAutopilotConfig {
  return {
    userId,
    autopilotEnabled: manager.autopilotEnabled,
    autopilotMode: prismaModeToHost(bnhub.mode),
    preferences: {
      autoPricing: bnhub.autoPricing,
      autoMessaging: bnhub.autoMessaging,
      autoPromotions: bnhub.autoPromotions,
      autoListingOptimization: bnhub.autoListingOptimization,
    },
    lastAutopilotRunAt: manager.lastAutopilotRunAt?.toISOString() ?? null,
    guestMessaging: {
      autoGuestMessagingEnabled: manager.autoGuestMessagingEnabled,
      guestMessageMode: manager.guestMessageMode === "auto_send_safe" ? "auto_send_safe" : "draft_only",
      triggers: normalizeTriggers(manager.guestMessageTriggersJson),
      hostInternalChecklistEnabled: manager.hostInternalChecklistEnabled,
    },
  };
}

export async function getHostAutopilotConfig(userId: string): Promise<HostAutopilotConfig> {
  const bnhub = await ensureBnhub(userId);
  const manager = await ensureManager(userId, bnhub);
  return toHostAutopilotConfig(userId, bnhub, manager);
}

export async function updateHostAutopilotConfig(
  userId: string,
  patch: UpdateHostAutopilotConfigInput
): Promise<HostAutopilotConfig> {
  const bnhub = await ensureBnhub(userId);
  const managerBefore = await ensureManager(userId, bnhub);

  const bnhubUpdate: Prisma.HostAutopilotSettingsUncheckedUpdateInput = {};
  const managerUpdate: Prisma.ManagerAiHostAutopilotSettingsUncheckedUpdateInput = {};

  if (patch.autopilotMode !== undefined) {
    bnhubUpdate.mode = MODE_TO_PRISMA[patch.autopilotMode];
    managerUpdate.autopilotMode = patch.autopilotMode;
    if (patch.autopilotMode === "OFF") {
      bnhubUpdate.paused = true;
      managerUpdate.autopilotEnabled = false;
    }
  }

  if (patch.autopilotEnabled !== undefined) {
    managerUpdate.autopilotEnabled = patch.autopilotEnabled;
    bnhubUpdate.paused = !patch.autopilotEnabled;
    if (!patch.autopilotEnabled) {
      bnhubUpdate.mode = AutopilotMode.OFF;
      managerUpdate.autopilotMode = "OFF";
    }
  }

  if (patch.autoPricing !== undefined) {
    bnhubUpdate.autoPricing = patch.autoPricing;
    managerUpdate.autoPricing = patch.autoPricing;
  }
  if (patch.autoMessaging !== undefined) {
    bnhubUpdate.autoMessaging = patch.autoMessaging;
    managerUpdate.autoMessaging = patch.autoMessaging;
  }
  if (patch.autoPromotions !== undefined) {
    bnhubUpdate.autoPromotions = patch.autoPromotions;
    managerUpdate.autoPromotions = patch.autoPromotions;
  }
  if (patch.autoListingOptimization !== undefined) {
    bnhubUpdate.autoListingOptimization = patch.autoListingOptimization;
    managerUpdate.autoListingOptimization = patch.autoListingOptimization;
  }

  if (patch.autoGuestMessagingEnabled !== undefined) {
    managerUpdate.autoGuestMessagingEnabled = patch.autoGuestMessagingEnabled;
  }
  if (patch.guestMessageMode !== undefined) {
    managerUpdate.guestMessageMode = patch.guestMessageMode;
  }
  if (patch.hostInternalChecklistEnabled !== undefined) {
    managerUpdate.hostInternalChecklistEnabled = patch.hostInternalChecklistEnabled;
  }
  if (patch.guestMessageTriggers !== undefined) {
    managerUpdate.guestMessageTriggersJson = mergeGuestTriggersJson(
      managerBefore.guestMessageTriggersJson,
      patch.guestMessageTriggers
    );
  }

  if (Object.keys(bnhubUpdate).length > 0) {
    await prisma.hostAutopilotSettings.update({
      where: { hostId: userId },
      data: bnhubUpdate,
    });
  }
  if (Object.keys(managerUpdate).length > 0) {
    await prisma.managerAiHostAutopilotSettings.update({
      where: { userId },
      data: managerUpdate,
    });
  }

  return getHostAutopilotConfig(userId);
}
