/** Spec entrypoint: `/api/playbooks` (alias of `/api/memory-strategy/playbooks` — MemoryPlaybook / strategy playbooks). */
import { NextRequest, NextResponse } from "next/server";
import type { MemoryDomain } from "@prisma/client";
import { prisma } from "@/lib/db";
import { authorizePlaybookMemoryApi } from "@/modules/playbook-memory/api/playbook-memory-authorize";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!(await authorizePlaybookMemoryApi(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const take = Math.min(Number(req.nextUrl.searchParams.get("take") ?? 50), 200);
  const skip = Math.max(Number(req.nextUrl.searchParams.get("skip") ?? 0), 0);

  const [total, rows] = await prisma.$transaction([
    prisma.memoryPlaybook.count(),
    prisma.memoryPlaybook.findMany({
      take,
      skip,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        key: true,
        name: true,
        description: true,
        domain: true,
        status: true,
        executionMode: true,
        scoreBand: true,
        totalExecutions: true,
        successfulExecutions: true,
        failedExecutions: true,
        avgExpectedValue: true,
        avgRealizedValue: true,
        avgRealizedRevenue: true,
        avgConversionLift: true,
        avgRiskScore: true,
        updatedAt: true,
        currentVersionId: true,
        lastPromotedAt: true,
        lastDemotedAt: true,
        currentVersion: { select: { id: true, version: true, isActive: true, title: true } },
      },
    }),
  ]);

  return NextResponse.json({ ok: true, total, playbooks: rows });
}

export async function POST(req: Request) {
  if (!(await authorizePlaybookMemoryApi(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Body required" }, { status: 400 });
  const o = body as Record<string, unknown>;

  const key = String(o.key ?? "").trim();
  const name = String(o.name ?? "").trim();
  const domain = o.domain as MemoryDomain;
  if (!key || !name || !domain) {
    return NextResponse.json({ error: "key, name, domain required" }, { status: 400 });
  }

  try {
    const pb = await prisma.memoryPlaybook.create({
      data: {
        key,
        name,
        description: o.description != null ? String(o.description) : undefined,
        domain,
        status: "DRAFT",
        tags: Array.isArray(o.tags) ? (o.tags as string[]) : [],
      },
    });
    return NextResponse.json({ ok: true, playbook: pb });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "create_failed";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
