import { NextRequest, NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { computeDealPriority } from "@/modules/brokerage-intelligence/deal-priority.engine";
import type { DealPortfolioSlice } from "@/modules/brokerage-intelligence/brokerage-intelligence.types";
import { portfolioIntelLog } from "@/modules/brokerage-intelligence/brokerage-intelligence-logger";

export const dynamic = "force-dynamic";

const BROKER_LIKE = new Set<PlatformRole>([PlatformRole.BROKER, PlatformRole.ADMIN]);

type Body = { dealId?: string; persist?: boolean; deal?: Partial<DealPortfolioSlice> };

export async function GET(req: NextRequest) {
  return run(req, null);
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Body;
  return run(req, body);
}

async function run(req: NextRequest, body: Body | null) {
  try {
    const userId = await getGuestId();
    if (!userId) return NextResponse.json({ ok: false, error: "Sign in required" }, { status: 401 });
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });
    if (!u || !BROKER_LIKE.has(u.role)) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }
    const dealId = (body?.dealId ?? new URL(req.url).searchParams.get("dealId") ?? "").trim() || (body?.deal?.id ?? "").trim();
    if (!dealId) {
      return NextResponse.json(
        { ok: false, error: "dealId required", result: null, disclaimer: "Advisory score only." },
        { status: 200 }
      );
    }
    const d = await prisma.deal
      .findFirst({
        where: u.role === "ADMIN" ? { id: dealId } : { id: dealId, brokerId: u.id },
        select: {
          id: true,
          priceCents: true,
          crmStage: true,
          status: true,
          leadId: true,
          updatedAt: true,
          brokerId: true,
          executionMetadata: true,
          lead: { select: { purchaseRegion: true } },
        },
      })
      .catch(() => null);
    if (!d) {
      return NextResponse.json({ ok: false, error: "Not found", result: null }, { status: 200 });
    }
    const ex = (d.executionMetadata as Record<string, unknown> | null) ?? null;
    const closeProb = typeof ex?.closeProbability === "number" ? ex.closeProbability : null;
    const slice: DealPortfolioSlice = {
      id: d.id,
      priceCents: d.priceCents,
      crmStage: d.crmStage,
      status: d.status,
      lastUpdatedAt: d.updatedAt,
      leadId: d.leadId,
      brokerId: d.brokerId,
      propertyRegion: d.lead?.purchaseRegion ?? null,
      closeProbHint: closeProb,
    };
    if (body?.deal?.silenceGapDays != null) slice.silenceGapDays = body.deal.silenceGapDays;
    if (body?.deal?.lastUpdatedAt) slice.lastUpdatedAt = new Date(body.deal.lastUpdatedAt);
    const result = computeDealPriority(slice);
    let priorityRowId: string | null = null;
    if (body?.persist) {
      try {
        const r = await prisma.dealPriorityScore.create({
          data: {
            dealId: d.id,
            priorityScore: result.priorityScore,
            riskLevel: result.riskLevel,
            urgencyLevel: result.urgencyLevel,
            rationaleJson: { lines: result.rationale },
          },
        });
        priorityRowId = r.id;
        portfolioIntelLog.dealPriority({ id: d.id, persisted: priorityRowId });
      } catch {
        /* no-op */
      }
    }
    return NextResponse.json(
      {
        ok: true,
        dealId: d.id,
        result,
        priorityRowId,
        disclaimer: "Priority is advisory; does not change deal status or notify parties automatically.",
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "unavailable", result: null, disclaimer: "Heuristic; not a prediction." },
      { status: 200 }
    );
  }
}
