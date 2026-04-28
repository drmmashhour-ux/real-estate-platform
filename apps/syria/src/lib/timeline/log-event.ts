import type { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/db";

export type TimelineLogInput = {
  entityType: string;
  entityId: string;
  action: string;
  actorId?: string | null;
  actorRole?: string | null;
  metadata?: Record<string, unknown> | null;
};

const SENSITIVE_KEYS = /^(password|secret|token|authorization|cookie|api[_-]?key|stripe[_-]?)/i;

function sanitizeMeta(meta: Record<string, unknown> | null | undefined): Prisma.InputJsonValue | undefined {
  if (!meta || typeof meta !== "object") return undefined;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(meta)) {
    if (SENSITIVE_KEYS.test(k)) continue;
    if (typeof v === "string" && v.length > 2000) {
      out[k] = `${v.slice(0, 2000)}…`;
      continue;
    }
    out[k] = v;
  }
  return Object.keys(out).length ? (out as Prisma.InputJsonValue) : undefined;
}

/**
 * Append-only timeline row. Failures are swallowed — never breaks caller flows.
 */
export async function logTimelineEvent(input: TimelineLogInput): Promise<void> {
  try {
    const entityType = input.entityType.trim().slice(0, 128);
    const entityId = input.entityId.trim().slice(0, 128);
    const action = input.action.trim().slice(0, 128);
    if (!entityType || !entityId || !action) return;

    await prisma.syriaEventTimeline.create({
      data: {
        entityType,
        entityId,
        action,
        actorId: input.actorId?.trim().slice(0, 128) ?? null,
        actorRole: input.actorRole?.trim().slice(0, 64) ?? null,
        metadata: sanitizeMeta(input.metadata ?? undefined),
      },
    });
  } catch (error) {
    console.error("[SYRIA_TIMELINE_LOG_FAILED]", input.action, error instanceof Error ? error.message : error);
  }
}
