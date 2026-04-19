import { NextResponse } from "next/server";
import { z } from "zod";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { engineFlags } from "@/config/feature-flags";
import { recordFastDealOutcome, recordFastDealSourceEvent } from "@/modules/growth/fast-deal-results.service";
import type { FastDealSourceType } from "@/modules/growth/fast-deal-results.types";

export const dynamic = "force-dynamic";

const sourceSchema = z.object({
  kind: z.literal("source"),
  sourceType: z.enum(["broker_sourcing", "landing_capture", "closing_playbook"]),
  sourceSubType: z.string().min(1).max(120),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const outcomeSchema = z.object({
  kind: z.literal("outcome"),
  outcomeType: z.string().min(1).max(80),
  sourceEventId: z.string().optional(),
  leadId: z.string().optional(),
  brokerId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const bodySchema = z.discriminatedUnion("kind", [sourceSchema, outcomeSchema]);

/** POST — log a manual source event or outcome (admin only). */
export async function POST(req: Request) {
  if (!engineFlags.fastDealResultsV1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const uid = await getGuestId();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: uid }, select: { role: true } });
  if (user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const b = parsed.data;
  if (b.kind === "source") {
    const row = await recordFastDealSourceEvent({
      sourceType: b.sourceType as FastDealSourceType,
      sourceSubType: b.sourceSubType,
      metadata: b.metadata as Record<string, unknown> | undefined,
      actorUserId: uid,
    });
    return NextResponse.json({ ok: !!row, id: row?.id ?? null });
  }

  const row = await recordFastDealOutcome({
    outcomeType: b.outcomeType,
    sourceEventId: b.sourceEventId,
    leadId: b.leadId,
    brokerId: b.brokerId,
    metadata: b.metadata as Record<string, unknown> | undefined,
  });
  return NextResponse.json({ ok: !!row, id: row?.id ?? null });
}
