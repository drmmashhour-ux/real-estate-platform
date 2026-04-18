import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { legalIntelligenceFlags } from "@/config/feature-flags";
import { getGuestId } from "@/lib/auth/session";
import {
  getLegalAnomalyIndicators,
  getLegalFraudIndicators,
  getLegalIntelligenceSignals,
  summarizeLegalIntelligence,
} from "@/modules/legal/legal-intelligence.service";
import {
  trackLegalAnomalyDetected,
  trackLegalFraudIndicatorFlagged,
  trackLegalIntelligenceSignalGenerated,
} from "@/modules/legal/legal-intelligence-monitoring.service";

export const dynamic = "force-dynamic";

function safeEntityId(raw: string | null): string | null {
  if (!raw || raw.length > 128) return null;
  if (!/^[a-zA-Z0-9_-]+$/.test(raw)) return null;
  return raw;
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

    const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (me?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const generatedAt = new Date().toISOString();

    if (!legalIntelligenceFlags.legalIntelligenceV1) {
      return NextResponse.json({
        summary: null,
        signals: [],
        anomalies: [],
        fraudIndicators: [],
        flags: { legalIntelligenceV1: false, scoped: false },
        freshness: { generatedAt },
      });
    }

    const sp = req.nextUrl.searchParams;
    const entityTypeParam = sp.get("entityType") ?? "platform";
    const entityIdRaw = safeEntityId(sp.get("entityId"));

    const listingScoped =
      entityTypeParam === "fsbo_listing" && !!entityIdRaw && entityIdRaw !== "global";

    if (!listingScoped) {
      const [pendingSlots, pendingSupporting] = await Promise.all([
        prisma.fsboListingDocument.count({ where: { status: "pending_review" } }).catch(() => 0),
        prisma.sellerSupportingDocument.count({ where: { status: "PENDING" } }).catch(() => 0),
      ]);

      trackLegalIntelligenceSignalGenerated({
        scope: "platform",
        pendingSlots,
        pendingSupporting,
      });

      return NextResponse.json({
        summary: {
          builtAt: generatedAt,
          entityType: "platform",
          entityId: "global",
          countsBySeverity: { info: 0, warning: 0, critical: 0 },
          countsBySignalType: {},
          totalSignals: 0,
          topAnomalyKinds: [],
          topFraudIndicatorLabels: [],
          freshnessNote:
            pendingSlots + pendingSupporting > 0
              ? `Operational backlog snapshot: ${pendingSlots} slot review(s), ${pendingSupporting} supporting pending — scope a listing for detailed advisory signals.`
              : "No queued items in aggregate snapshot — scope a listing for deterministic signals.",
        },
        signals: [],
        anomalies: [],
        fraudIndicators: [],
        flags: {
          legalIntelligenceV1: true,
          scoped: false,
          operationalBacklog: { pendingSlotReviews: pendingSlots, pendingSupportingReviews: pendingSupporting },
        },
        freshness: { generatedAt },
      });
    }

    const params = {
      entityType: "fsbo_listing",
      entityId: entityIdRaw as string,
      actorType: sp.get("actorType") ?? "seller",
      workflowType: sp.get("workflowType") ?? "fsbo_seller_documents",
    };

    const [summary, signalList, anomalies, fraudIndicators] = await Promise.all([
      summarizeLegalIntelligence(params),
      getLegalIntelligenceSignals(params),
      legalIntelligenceFlags.legalAnomalyDetectionV1
        ? getLegalAnomalyIndicators(params)
        : Promise.resolve([]),
      getLegalFraudIndicators(params),
    ]);

    const totalSignals = summary.totalSignals;

    trackLegalIntelligenceSignalGenerated({ scope: "listing", entityType, entityId, totalSignals });
    trackLegalAnomalyDetected({ count: anomalies.length });
    trackLegalFraudIndicatorFlagged({ count: fraudIndicators.length });

    return NextResponse.json({
      summary,
      signals: signalList,
      anomalies,
      fraudIndicators,
      flags: { legalIntelligenceV1: true, scoped: true },
      freshness: { generatedAt },
    });
  } catch {
    return NextResponse.json(
      {
        summary: null,
        signals: [],
        anomalies: [],
        fraudIndicators: [],
        flags: { legalIntelligenceV1: legalIntelligenceFlags.legalIntelligenceV1, scoped: false },
        freshness: { generatedAt: new Date().toISOString() },
      },
      { status: 200 },
    );
  }
}
