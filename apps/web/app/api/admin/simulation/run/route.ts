import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { runWhatIfSimulation } from "@/modules/simulation/simulation.engine";
import { loadSimulationBaseline } from "@/modules/simulation/simulation-baseline.service";
import { parseScenarioInput } from "@/modules/simulation/simulation-input";
import { simulationLog } from "@/modules/simulation/simulation-log";

import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const input = parseScenarioInput(body);
  if (!input) {
    return NextResponse.json({ error: "invalid_scenario" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { role: true },
  });
  if (!user) {
    return NextResponse.json({ error: "user_not_found" }, { status: 404 });
  }

  const baseline = await loadSimulationBaseline(auth.userId, user.role, input.regionKey);
  const result = runWhatIfSimulation(baseline, input);
  simulationLog.emit("preview", { userId: auth.userId, input });

  return NextResponse.json(result);
}
