import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import { enrollEmailNurture, triggerWelcomeAfterCapture } from "@/modules/growth/email-automation.service";

const TAG = "[growth.funnel]";

export type FunnelCategory = "VISIT" | "SIGNUP" | "ACTIVATION" | "CONVERSION";

export async function recordFunnelEvent(input: {
  category: FunnelCategory;
  path?: string | null;
  sessionId?: string | null;
  email?: string | null;
  metaJson?: Record<string, unknown>;
}) {
  const row = await prisma.lecipmGrowthFunnelEvent.create({
    data: {
      category: input.category.slice(0, 24),
      path: input.path?.slice(0, 640) ?? null,
      sessionId: input.sessionId?.slice(0, 80) ?? null,
      email: input.email?.slice(0, 320) ?? null,
      metaJson: input.metaJson ?? undefined,
    },
  });
  logInfo(TAG, { category: input.category, id: row.id });
  return row;
}

export async function captureGrowthLead(input: {
  email: string;
  source: string;
  metaJson?: Record<string, unknown>;
}) {
  const row = await prisma.lecipmGrowthCaptureLead.create({
    data: {
      email: input.email.trim().toLowerCase().slice(0, 320),
      source: input.source.trim().slice(0, 160),
      metaJson: input.metaJson ?? undefined,
    },
  });

  await enrollEmailNurture(row.email).catch(() => {});
  await triggerWelcomeAfterCapture(row.email).catch(() => {});
  await recordFunnelEvent({
    category: "CONVERSION",
    email: row.email,
    metaJson: { ...input.metaJson, captureSource: input.source, leadId: row.id },
  });

  return row;
}
