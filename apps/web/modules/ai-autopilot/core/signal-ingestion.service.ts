/**
 * Collects lightweight, real signals from existing tables — additive; read-only queries.
 * Extend with more sources over time; never fabricate metrics.
 */
import { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { engineFlags } from "@/config/feature-flags";
import { normalizeSignal } from "./signal-normalizer.service";
import type { NormalizedSignal } from "../ai-autopilot.types";

export async function ingestSignalsForUser(opts: { userId: string; role: PlatformRole }): Promise<NormalizedSignal[]> {
  const out: NormalizedSignal[] = [];
  const { userId, role } = opts;

  if (role === "HOST" || role === "USER") {
    const weakListings = await prisma.shortTermListing.findMany({
      where: { ownerId: userId },
      select: {
        id: true,
        title: true,
        listingQualityScore: { select: { qualityScore: true } },
      },
      take: 20,
    });
    for (const l of weakListings) {
      const q = l.listingQualityScore?.qualityScore ?? null;
      if (q != null && q < 58) {
        out.push(
          normalizeSignal({
            domain: "bnhub",
            signalType: "listing_quality_low",
            entityType: "short_term_listing",
            entityId: l.id,
            severity: "medium",
            confidence: 0.85,
            metadata: { qualityScore: q, title: l.title },
          }),
        );
      }
    }

    const pendingOpt = await prisma.listingOptimizationSuggestion.count({
      where: { listing: { ownerId: userId }, status: "suggested" },
    });
    if (pendingOpt > 0) {
      out.push(
        normalizeSignal({
          domain: "listing",
          signalType: "optimization_pending",
          entityType: "user",
          entityId: userId,
          severity: "low",
          confidence: 1,
          metadata: { pendingSuggestions: pendingOpt },
        }),
      );
    }
  }

  if (role === "BROKER" && engineFlags.growthMachineV1) {
    const stale = await prisma.lead.count({
      where: {
        introducedByBrokerId: userId,
        pipelineStatus: { notIn: ["won", "lost"] },
        updatedAt: { lt: new Date(Date.now() - 14 * 86400000) },
      },
    });
    if (stale > 0) {
      out.push(
        normalizeSignal({
          domain: "lead_crm",
          signalType: "stale_leads",
          entityType: "broker",
          entityId: userId,
          severity: "medium",
          confidence: 0.9,
          metadata: { staleLeadCount: stale },
        }),
      );
    }
  }

  return out;
}
