import { NextResponse } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { requireRole } from "@/lib/auth/require-role";

export const dynamic = "force-dynamic";

function avg(xs: number[]) {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}

export async function GET(req: Request) {
  const auth = await requireRole("admin");
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const experimentId = searchParams.get("experimentId");

  const experiments = await prisma.autonomyExperiment.findMany({
    where: experimentId ? { id: experimentId } : {},
    orderBy: { updatedAt: "desc" },
    take: experimentId ? 1 : 50,
    include: {
      assignments: { select: { group: true, entityId: true } },
      results: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  let outcomesSummary: Record<string, { count: number; avgRevenue: number; avgBookings: number }> | null = null;

  if (experimentId) {
    const outs = await prisma.autonomyExperimentOutcome.findMany({
      where: { experimentId },
      select: { group: true, revenue: true, bookings: true },
    });
    const treatment = outs.filter((o) => o.group === "treatment");
    const control = outs.filter((o) => o.group === "control");
    outcomesSummary = {
      treatment: {
        count: treatment.length,
        avgRevenue: avg(treatment.map((x) => x.revenue)),
        avgBookings: avg(treatment.map((x) => x.bookings)),
      },
      control: {
        count: control.length,
        avgRevenue: avg(control.map((x) => x.revenue)),
        avgBookings: avg(control.map((x) => x.bookings)),
      },
    };
  }

  return NextResponse.json({
    success: true,
    experiments,
    outcomesSummary,
  });
}
