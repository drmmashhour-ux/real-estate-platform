import { NextResponse } from "next/server";
import { MarketplaceMemoryRole, type Prisma } from "@prisma/client";
import { z } from "zod";
import { intelligenceFlags } from "@/config/feature-flags";
import { requireUser } from "@/lib/auth/require-user";
import { prisma } from "@/lib/db";
import { logMemoryAudit } from "@/lib/marketplace-memory/memory-audit";
import { refreshUserMemoryInsights } from "@/lib/marketplace-memory/memory-insight.engine";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  role: z.nativeEnum(MarketplaceMemoryRole).optional(),
  personalizationEnabled: z.boolean().optional(),
  intentSummaryJson: z.record(z.string(), z.unknown()).optional(),
  preferenceSummaryJson: z.record(z.string(), z.unknown()).optional(),
  behaviorSummaryJson: z.record(z.string(), z.unknown()).optional(),
  financialProfileJson: z.record(z.string(), z.unknown()).nullable().optional(),
  esgProfileJson: z.record(z.string(), z.unknown()).nullable().optional(),
  riskProfileJson: z.record(z.string(), z.unknown()).nullable().optional(),
  deleteInsightIds: z.array(z.string()).max(200).optional(),
});

function mergeRecord(base: unknown, patch: Record<string, unknown> | undefined): Record<string, unknown> {
  const a =
    base && typeof base === "object" && !Array.isArray(base) ? { ...(base as Record<string, unknown>) } : {};
  return patch ? { ...a, ...patch } : a;
}

/** POST /api/memory/update — user edits / opt-out / selective insight deletion. */
export async function POST(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  if (!intelligenceFlags.marketplaceMemoryEngineV1) {
    return NextResponse.json({ ok: false, error: "feature_disabled" }, { status: 404 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_body", details: parsed.error.flatten() }, { status: 400 });
  }

  const body = parsed.data;

  await prisma.userMemoryProfile.upsert({
    where: { userId: auth.user.id },
    create: { userId: auth.user.id },
    update: {},
  });

  const existing = await prisma.userMemoryProfile.findUniqueOrThrow({ where: { userId: auth.user.id } });

  if (body.deleteInsightIds?.length) {
    await prisma.userMemoryInsight.deleteMany({
      where: { userId: auth.user.id, id: { in: body.deleteInsightIds } },
    });
  }

  if (body.personalizationEnabled === false) {
    await prisma.userMemoryInsight.deleteMany({ where: { userId: auth.user.id } });
  }

  const data: Prisma.UserMemoryProfileUpdateInput = {
    lastUpdatedAt: new Date(),
  };

  if (body.role != null) data.role = body.role;
  if (body.personalizationEnabled != null) data.personalizationEnabled = body.personalizationEnabled;

  if (body.intentSummaryJson != null) {
    data.intentSummaryJson = mergeRecord(existing.intentSummaryJson, body.intentSummaryJson);
  }
  if (body.preferenceSummaryJson != null) {
    data.preferenceSummaryJson = mergeRecord(existing.preferenceSummaryJson, body.preferenceSummaryJson);
  }
  if (body.behaviorSummaryJson != null) {
    data.behaviorSummaryJson = mergeRecord(existing.behaviorSummaryJson, body.behaviorSummaryJson);
  }
  if (body.financialProfileJson !== undefined) {
    data.financialProfileJson = body.financialProfileJson;
  }
  if (body.esgProfileJson !== undefined) {
    data.esgProfileJson = body.esgProfileJson;
  }
  if (body.riskProfileJson !== undefined) {
    data.riskProfileJson = body.riskProfileJson;
  }

  await prisma.userMemoryProfile.update({
    where: { userId: auth.user.id },
    data,
  });

  const personalizationStillOn =
    body.personalizationEnabled != null ? body.personalizationEnabled : existing.personalizationEnabled;
  if (personalizationStillOn) {
    await refreshUserMemoryInsights(auth.user.id);
  }

  void logMemoryAudit({
    userId: auth.user.id,
    actionType: "memory_updated",
    summary: "User updated marketplace memory profile",
    actorId: auth.user.id,
    details: {
      fields: Object.keys(body).filter((k) => body[k as keyof typeof body] !== undefined),
    },
  }).catch(() => null);

  const profile = await prisma.userMemoryProfile.findUnique({ where: { userId: auth.user.id } });
  return NextResponse.json({ ok: true, profile });
}
