import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@repo/db";
import { legalIntelligenceFlags } from "@/config/feature-flags";
import { getGuestId } from "@/lib/auth/session";
import { recommendLegalEscalation } from "@/modules/legal/legal-escalation.service";
import { summarizeLegalIntelligence } from "@/modules/legal/legal-intelligence.service";
import { trackLegalQueuePrioritized } from "@/modules/legal/legal-intelligence-monitoring.service";
import { loadLegalReviewQueueItems } from "@/modules/legal/legal-review-queue.loader";
import { prioritizeLegalReviewQueue } from "@/modules/legal/legal-review-priority.service";

export const dynamic = "force-dynamic";

function parseLimit(raw: string | null): number {
  const n = raw ? Number.parseInt(raw, 10) : 40;
  if (!Number.isFinite(n) || n < 1) return 40;
  return Math.min(n, 100);
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

    const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (me?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const generatedAt = new Date().toISOString();

    if (!legalIntelligenceFlags.legalReviewPriorityV1 && !legalIntelligenceFlags.legalIntelligenceV1) {
      return NextResponse.json({
        queue: [],
        prioritized: [],
        summary: null,
        escalation: null,
        flags: { legalReviewPriorityV1: false, legalIntelligenceV1: legalIntelligenceFlags.legalIntelligenceV1 },
        freshness: { generatedAt },
      });
    }

    const limit = parseLimit(req.nextUrl.searchParams.get("limit"));
    const items = await loadLegalReviewQueueItems(limit);

    let escalationSummary = null;
    if (items.length > 0 && legalIntelligenceFlags.legalIntelligenceV1) {
      escalationSummary = await summarizeLegalIntelligence({
        entityType: "fsbo_listing",
        entityId: items[0]?.entityId ?? "",
        actorType: "seller",
        workflowType: "fsbo_seller_documents",
      }).catch(() => null);
    }

    const prioritized = prioritizeLegalReviewQueue(items, null);
    const escalation = recommendLegalEscalation(escalationSummary);

    trackLegalQueuePrioritized({ items: prioritized.length, rawItems: items.length });

    return NextResponse.json({
      queue: items,
      prioritized,
      summary: {
        rawCount: items.length,
        prioritizedCount: prioritized.length,
      },
      escalation,
      flags: {
        legalReviewPriorityV1: legalIntelligenceFlags.legalReviewPriorityV1,
        legalIntelligenceV1: legalIntelligenceFlags.legalIntelligenceV1,
      },
      freshness: { generatedAt },
    });
  } catch {
    return NextResponse.json(
      {
        queue: [],
        prioritized: [],
        summary: null,
        escalation: null,
        flags: {
          legalReviewPriorityV1: legalIntelligenceFlags.legalReviewPriorityV1,
          legalIntelligenceV1: legalIntelligenceFlags.legalIntelligenceV1,
        },
        freshness: { generatedAt: new Date().toISOString() },
      },
      { status: 200 },
    );
  }
}
