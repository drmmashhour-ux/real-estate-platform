import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { createDraftExperiment, listExperiments } from "@/modules/evolution/experiment.service";
import type { EvolutionDomain } from "@/modules/evolution/evolution.types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (me?.role !== PlatformRole.ADMIN && me?.role !== PlatformRole.BROKER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const domain = url.searchParams.get("domain") as EvolutionDomain | null;

  try {
    const experiments = await listExperiments(domain ?? undefined);
    return NextResponse.json({ experiments });
  } catch {
    return NextResponse.json({ error: "Failed to list experiments" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (me?.role !== PlatformRole.ADMIN) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const body = (await req.json()) as Partial<{
    experimentKey: string;
    name: string;
    domain: EvolutionDomain;
    armsJson: Record<string, unknown>;
    trafficCapPercent: number;
    requiresHumanApproval: boolean;
  }>;

  if (!body.experimentKey?.trim() || !body.name?.trim() || !body.domain || !body.armsJson) {
    return NextResponse.json({ error: "experimentKey, name, domain, armsJson required" }, { status: 400 });
  }

  try {
    const row = await createDraftExperiment({
      experimentKey: body.experimentKey.trim(),
      name: body.name.trim(),
      domain: body.domain,
      armsJson: body.armsJson,
      trafficCapPercent: body.trafficCapPercent,
      requiresHumanApproval: body.requiresHumanApproval,
      createdByUserId: userId,
    });
    return NextResponse.json({ experiment: row });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "create failed";
    if (msg.includes("Unique constraint")) {
      return NextResponse.json({ error: "experimentKey already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Unable to create experiment" }, { status: 500 });
  }
}
