import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { authorizePlaybookMemoryApi } from "@/modules/playbook-memory/api/playbook-memory-authorize";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await authorizePlaybookMemoryApi(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: playbookId } = await ctx.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Body required" }, { status: 400 });
  const o = body as Record<string, unknown>;
  const strategyDefinition = o.strategyDefinition;
  if (typeof strategyDefinition !== "object" || strategyDefinition === null) {
    return NextResponse.json({ error: "strategyDefinition object required" }, { status: 400 });
  }

  const agg = await prisma.memoryPlaybookVersion.aggregate({
    where: { playbookId },
    _max: { version: true },
  });
  const nextVersion = (agg._max.version ?? 0) + 1;

  try {
    const v = await prisma.memoryPlaybookVersion.create({
      data: {
        playbookId,
        version: nextVersion,
        title: o.title != null ? String(o.title) : undefined,
        strategyDefinition: strategyDefinition as object,
        retrievalHints: o.retrievalHints as object | undefined,
        actionTemplate: o.actionTemplate as object | undefined,
        policyRequirements: o.policyRequirements as object | undefined,
        riskLimits: o.riskLimits as object | undefined,
        rolloutConfig: o.rolloutConfig as object | undefined,
        isActive: false,
      },
    });
    return NextResponse.json({ ok: true, version: v });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "create_version_failed";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
