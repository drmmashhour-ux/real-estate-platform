import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { createNotification } from "@/modules/notifications/services/create-notification";
import { deriveCurrentStep, runRenoclimatAssistant } from "./renoclimat-assistant.engine";
import type { RenoclimatAssistantEngineOutput } from "./renoclimat-assistant.engine";
import {
  RENOCLIMAT_ASSISTANT_DISCLAIMER,
  type RenoclimatChecklistKey,
  RENOCLIMAT_CHECKLIST_ORDER,
} from "./renoclimat-steps";

export type RenoclimatAssistantState = {
  disclaimer: typeof RENOCLIMAT_ASSISTANT_DISCLAIMER;
  remindersEnabled: boolean;
  checklist: Record<RenoclimatChecklistKey, boolean>;
  engine: RenoclimatAssistantEngineOutput;
};

function emptyChecklist(): Record<RenoclimatChecklistKey, boolean> {
  return Object.fromEntries(RENOCLIMAT_CHECKLIST_ORDER.map((k) => [k, false])) as Record<
    RenoclimatChecklistKey,
    boolean
  >;
}

function mergeChecklist(raw: unknown): Record<RenoclimatChecklistKey, boolean> {
  const base = emptyChecklist();
  if (raw !== null && typeof raw === "object" && !Array.isArray(raw)) {
    for (const key of RENOCLIMAT_CHECKLIST_ORDER) {
      const v = (raw as Record<string, unknown>)[key];
      if (typeof v === "boolean") base[key] = v;
    }
  }
  return base;
}

export async function getOrCreateRenoclimatAssistantProgress(userId: string) {
  return prisma.renoclimatAssistantProgress.upsert({
    where: { userId },
    create: {
      userId,
      checklistJson: emptyChecklist() as unknown as Prisma.InputJsonValue,
    },
    update: {},
  });
}

export async function getRenoclimatAssistantState(userId: string): Promise<RenoclimatAssistantState> {
  const row = await getOrCreateRenoclimatAssistantProgress(userId);
  const checklist = mergeChecklist(row.checklistJson);
  const engine = runRenoclimatAssistant({ checklistJson: checklist });
  return {
    disclaimer: RENOCLIMAT_ASSISTANT_DISCLAIMER,
    remindersEnabled: row.remindersEnabled,
    checklist,
    engine,
  };
}

const REMINDER_COOLDOWN_MS = 1000 * 60 * 60 * 24 * 3;

async function maybeNotifyNextStep(args: {
  userId: string;
  remindersEnabled: boolean;
  prevStep: number;
  nextStep: number;
  checklistPatch: Partial<Record<RenoclimatChecklistKey, boolean>>;
  lastReminderSentAt: Date | null;
}) {
  if (!args.remindersEnabled) return;

  const advanced = args.nextStep > args.prevStep;
  const toggledComplete = Object.entries(args.checklistPatch).some(
    ([key, val]) =>
      val === true && RENOCLIMAT_CHECKLIST_ORDER.includes(key as RenoclimatChecklistKey),
  );
  if (!advanced && !toggledComplete) return;

  if (args.lastReminderSentAt) {
    const delta = Date.now() - args.lastReminderSentAt.getTime();
    if (delta < REMINDER_COOLDOWN_MS) return;
  }

  const title =
    advanced && args.nextStep <= 5
      ? `Rénoclimat assistant — move to step ${args.nextStep}`
      : "Rénoclimat assistant — checklist updated";

  const created = await createNotification({
    userId: args.userId,
    type: "REMINDER",
    title,
    message:
      advanced && args.nextStep <= 5
        ? `Nice progress. Your next focus is step ${args.nextStep} in the LECIPM assistant (not an official submission).`
        : "Your Rénoclimat checklist changed. Review the next action in the green assistant.",
    actionUrl: "/dashboard/green/assistant",
    actionLabel: "Open assistant",
    priority: "NORMAL",
    metadata: {
      kind: "renoclimat_assistant",
      prevStep: args.prevStep,
      nextStep: args.nextStep,
    },
  });

  if (created) {
    await prisma.renoclimatAssistantProgress.update({
      where: { userId: args.userId },
      data: { lastReminderSentAt: new Date() },
    });
  }
}

export async function updateRenoclimatAssistantProgress(args: {
  userId: string;
  patch: Partial<Record<RenoclimatChecklistKey, boolean>>;
  remindersEnabled?: boolean;
}): Promise<RenoclimatAssistantState> {
  const row = await getOrCreateRenoclimatAssistantProgress(args.userId);
  const merged = mergeChecklist(row.checklistJson);
  const prevStep = deriveCurrentStep(merged);

  for (const [k, v] of Object.entries(args.patch)) {
    if (!RENOCLIMAT_CHECKLIST_ORDER.includes(k as RenoclimatChecklistKey)) continue;
    if (typeof v !== "boolean") continue;
    merged[k as RenoclimatChecklistKey] = v;
  }

  const nextStep = deriveCurrentStep(merged);

  await prisma.renoclimatAssistantProgress.update({
    where: { userId: args.userId },
    data: {
      checklistJson: merged as unknown as Prisma.InputJsonValue,
      ...(typeof args.remindersEnabled === "boolean" ? { remindersEnabled: args.remindersEnabled } : {}),
    },
  });

  const remindersOn =
    typeof args.remindersEnabled === "boolean" ? args.remindersEnabled : row.remindersEnabled;

  await maybeNotifyNextStep({
    userId: args.userId,
    remindersEnabled: remindersOn,
    prevStep,
    nextStep,
    checklistPatch: args.patch,
    lastReminderSentAt: row.lastReminderSentAt,
  });

  return getRenoclimatAssistantState(args.userId);
}

export { RENOCLIMAT_ASSISTANT_DISCLAIMER, deriveCurrentStep };
