import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { recordEvolutionOutcome } from "@/modules/evolution/outcome-tracker.service";
import type { EvolutionDomain, EvolutionMetricType } from "@/modules/evolution/evolution.types";

export const dynamic = "force-dynamic";

/** Record an outcome event (operators only). Never applies policy directly. */
export async function POST(req: Request) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (me?.role !== PlatformRole.ADMIN && me?.role !== PlatformRole.BROKER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as Partial<{
    domain: EvolutionDomain;
    metricType: EvolutionMetricType;
    strategyKey: string | null;
    experimentKey: string | null;
    entityType: string | null;
    entityId: string | null;
    expectedJson: Record<string, unknown> | null;
    actualJson: Record<string, unknown> | null;
    expected: number | null;
    actual: number | null;
    reinforceStrategy: boolean;
  }>;

  if (!body.domain || !body.metricType) {
    return NextResponse.json({ error: "domain and metricType required" }, { status: 400 });
  }

  try {
    const result = await recordEvolutionOutcome({
      domain: body.domain,
      metricType: body.metricType,
      strategyKey: body.strategyKey ?? undefined,
      experimentKey: body.experimentKey ?? undefined,
      entityType: body.entityType ?? undefined,
      entityId: body.entityId ?? undefined,
      expectedJson: body.expectedJson ?? undefined,
      actualJson: body.actualJson ?? undefined,
      expected: body.expected ?? undefined,
      actual: body.actual ?? undefined,
      reinforceStrategy: Boolean(body.reinforceStrategy),
    });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Unable to record outcome" }, { status: 500 });
  }
}
