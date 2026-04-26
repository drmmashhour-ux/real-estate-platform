import { NextRequest, NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { recommendBrokerForLead, persistRoutingDecision } from "@/modules/brokerage-intelligence/lead-routing.engine";
import type { LeadPortfolioSlice } from "@/modules/brokerage-intelligence/brokerage-intelligence.types";

export const dynamic = "force-dynamic";

const BROKER_LIKE = new Set<PlatformRole>([PlatformRole.BROKER, PlatformRole.ADMIN]);

type Body = {
  lead?: Partial<LeadPortfolioSlice> & { id?: string };
  persist?: boolean;
};

export async function POST(req: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) return NextResponse.json({ ok: false, error: "Sign in required" }, { status: 401 });
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!u || !BROKER_LIKE.has(u.role)) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }
    const raw = (await req.json().catch(() => ({}))) as Body;
    const id = typeof raw.lead?.id === "string" ? raw.lead.id : "";
    if (!id) {
      return NextResponse.json(
        { ok: false, error: "lead.id required", routing: null, disclaimer: "No auto-assignment from this endpoint." },
        { status: 200 }
      );
    }
    const slice: LeadPortfolioSlice = {
      id,
      location: raw.lead?.location ?? null,
      purchaseRegion: raw.lead?.purchaseRegion ?? null,
      priceHintCents: raw.lead?.priceHintCents ?? null,
      leadType: raw.lead?.leadType ?? null,
      leadSource: raw.lead?.leadSource ?? null,
      financingLabel: raw.lead?.financingLabel ?? null,
      urgencyLabel: raw.lead?.urgencyLabel ?? null,
      workspaceId: raw.lead?.workspaceId ?? null,
      introducedByBrokerId: raw.lead?.introducedByBrokerId ?? null,
      estimatedValue: raw.lead?.estimatedValue ?? null,
      dealValue: raw.lead?.dealValue ?? null,
      engagementScore: raw.lead?.engagementScore ?? null,
      propertyType: raw.lead?.propertyType ?? null,
      mortgageInquiry: raw.lead?.mortgageInquiry,
    };
    const routing = await recommendBrokerForLead(slice);
    let decisionId: string | null = null;
    if (raw.persist && routing.recommendedBrokerId) {
      decisionId = await persistRoutingDecision(slice, routing);
    }
    return NextResponse.json(
      {
        ok: true,
        routing,
        decisionId,
        disclaimer: "Routing is a recommendation; product rules decide whether to soft-assign. No irreversible auto action here.",
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "unavailable", routing: null, disclaimer: "Heuristic; not a prediction." },
      { status: 200 }
    );
  }
}
