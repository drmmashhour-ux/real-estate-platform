import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { deleteScenario, updateScenario } from "@/modules/simulation/simulation-scenarios.service";
import { parseScenarioInput } from "@/modules/simulation/simulation-input";

import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id } = await ctx.params;

  let body: { name?: string; isRecommended?: boolean; params?: unknown };
  try {
    body = (await request.json()) as { name?: string; isRecommended?: boolean; params?: unknown };
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { role: true },
  });
  if (!user) {
    return NextResponse.json({ error: "user_not_found" }, { status: 404 });
  }

  const params = body.params != null ? parseScenarioInput(body.params) : undefined;
  if (body.params != null && !params) {
    return NextResponse.json({ error: "invalid_scenario" }, { status: 400 });
  }

  const row = await updateScenario(
    id,
    auth.userId,
    {
      ...(body.name != null ? { name: body.name } : {}),
      ...(body.isRecommended != null ? { isRecommended: body.isRecommended } : {}),
      ...(params ? { params } : {}),
    },
    user.role,
  );
  if (!row) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ scenario: row });
}

export async function DELETE(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id } = await ctx.params;
  const ok = await deleteScenario(id, auth.userId);
  if (!ok) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
