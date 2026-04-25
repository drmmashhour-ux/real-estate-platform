import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { listScenarios, createScenario } from "@/modules/simulation/simulation-scenarios.service";
import { parseScenarioInput } from "@/modules/simulation/simulation-input";

import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const rows = await listScenarios(auth.userId);
  return NextResponse.json({ scenarios: rows });
}

export async function POST(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const name =
    typeof body.name === "string" && body.name.trim() ? body.name.trim() : "Untitled scenario";
  const input = parseScenarioInput(body.params ?? body);
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

  const row = await createScenario(auth.userId, name, input, user.role);
  return NextResponse.json({ scenario: row });
}
