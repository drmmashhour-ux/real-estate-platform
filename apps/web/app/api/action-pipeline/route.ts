import { NextResponse } from "next/server";
import { ActionPipelineType, PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import {
  createActionPipelineRecord,
  listActionPipelinesForDeal,
} from "@/modules/action-pipeline/action-pipeline.service";

export const dynamic = "force-dynamic";

const TYPES = new Set<string>(Object.values(ActionPipelineType));

function parseType(raw: string): ActionPipelineType | null {
  return TYPES.has(raw) ? (raw as ActionPipelineType) : null;
}

/**
 * GET /api/action-pipeline?dealId= — list pipelines for a deal (assigned broker or admin).
 */
export async function GET(request: Request) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (user.role !== PlatformRole.BROKER && user.role !== PlatformRole.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const dealId = new URL(request.url).searchParams.get("dealId")?.trim() ?? "";
  if (!dealId) return NextResponse.json({ error: "dealId query required" }, { status: 400 });

  const rows = await listActionPipelinesForDeal(dealId, userId, user.role === PlatformRole.ADMIN);
  return NextResponse.json({
    items: rows.map((r) => ({
      id: r.id,
      type: r.type,
      status: r.status,
      aiGenerated: r.aiGenerated,
      dealId: r.dealId,
      createdAt: r.createdAt.toISOString(),
      brokerSignature: r.brokerSignature,
    })),
  });
}

/**
 * POST /api/action-pipeline — create DRAFT or READY_FOR_SIGNATURE row (broker on deal, or admin).
 */
export async function POST(request: Request) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (user.role !== PlatformRole.BROKER && user.role !== PlatformRole.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: {
    type?: string;
    dataJson?: Record<string, unknown>;
    dealId?: string | null;
    aiGenerated?: boolean;
    initialStatus?: "DRAFT" | "READY_FOR_SIGNATURE";
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const type = typeof body.type === "string" ? parseType(body.type) : null;
  if (!type) return NextResponse.json({ error: "Invalid type" }, { status: 400 });

  const dealId = body.dealId != null && body.dealId !== "" ? String(body.dealId).trim() : null;
  if (!dealId && user.role !== PlatformRole.ADMIN) {
    return NextResponse.json({ error: "dealId required for broker-created actions" }, { status: 400 });
  }
  if (dealId && user.role === PlatformRole.BROKER) {
    const ok = await prisma.deal.findFirst({
      where: { id: dealId, brokerId: userId },
      select: { id: true },
    });
    if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const initialStatus = body.initialStatus === "DRAFT" ? "DRAFT" : "READY_FOR_SIGNATURE";
  const dataJson =
    body.dataJson && typeof body.dataJson === "object" && !Array.isArray(body.dataJson) ?
      body.dataJson
    : {};

  try {
    const created = await createActionPipelineRecord({
      type,
      dataJson,
      dealId,
      aiGenerated: body.aiGenerated !== false,
      initialStatus,
      actorUserId: userId,
    });
    return NextResponse.json({ ok: true, id: created.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Create failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
