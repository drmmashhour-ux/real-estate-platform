import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { checkGrowthPaywall } from "@/src/modules/growth-funnel/application/checkGrowthPaywall";
import { recordSuccessfulSimulatorRun } from "@/src/modules/growth-funnel/application/recordSuccessfulSimulatorRun";
import { runFirstValueSimulation } from "@/src/modules/growth-funnel/application/runFirstValueSimulation";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in to run the guided simulator and track your progress." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const propertyId = typeof body.propertyId === "string" ? body.propertyId : null;

  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, role: true },
  });
  if (!u) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const paywall = await checkGrowthPaywall({
    userId,
    plan: u.plan,
    role: u.role,
    kind: "simulator",
  });
  if (!paywall.allowed) {
    return NextResponse.json(
      { error: "SIMULATOR_LIMIT", remaining: paywall.remaining, limit: paywall.limit },
      { status: 403 },
    );
  }

  const started = Date.now();
  const out = await runFirstValueSimulation({ propertyId, userId });
  const elapsedMs = Date.now() - started;

  if (!out.ok) {
    return NextResponse.json({ error: out.error }, { status: 400 });
  }

  await recordSuccessfulSimulatorRun({
    userId,
    propertyId: out.propertyId,
    source: "first_value_flow",
  });

  return NextResponse.json({
    propertyId: out.propertyId,
    summary: out.summary,
    result: out.result,
    elapsedMs,
    underTargetSeconds: elapsedMs < 60_000,
  });
}
