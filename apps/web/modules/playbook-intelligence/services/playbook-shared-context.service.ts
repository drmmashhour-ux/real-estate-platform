import type { MemoryDomain, PlaybookAssignment, PlaybookScoreBand, MemoryPlaybook } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getDomainModule } from "@/modules/playbook-domains/shared/domain-registry";
import { augmentRecommendationContext } from "@/modules/playbook-domains/augment-recommendation-context";
import { playbookLog } from "@/modules/playbook-memory/playbook-memory.logger";
import type { RecommendationRequestContext } from "@/modules/playbook-memory/types/playbook-memory.types";
import { buildSharedSignature } from "../shared/shared-context-signature";
import { toSharedContextRepresentation, normalizeSharedContext } from "../shared/shared-context-normalize";
import type { SharedContextRepresentation } from "../shared/shared-context.types";

async function buildDomainAugmentedRequest(ctx: RecommendationRequestContext): Promise<RecommendationRequestContext> {
  return augmentRecommendationContext(ctx);
}

export const playbookSharedContextService = {
  /**
   * Build shared representation from a recommendation request; uses domain `buildContext` when registered.
   */
  async buildSharedContextFromDomainInput(params: { context: RecommendationRequestContext }): Promise<SharedContextRepresentation | null> {
    try {
      const aug = await buildDomainAugmentedRequest(params.context);
      const mod = getDomainModule(String(aug.domain));
      let extra: Record<string, string | number | boolean | null> = {};
      if (mod) {
        const b = (await mod.buildContext(aug).catch(() => ({}))) as unknown;
        if (b && typeof b === "object" && !Array.isArray(b)) {
          extra = normalizeSharedContext(b) as typeof extra;
        }
      }
      const rep = toSharedContextRepresentation({
        originDomain: String(aug.domain),
        features: { ...aug.signals, ...extra },
        explicit: (aug.segment as unknown) ?? {},
        market: aug.market,
        segment: aug.segment,
      });
      rep.explicitPreferences = { ...rep.explicitPreferences, ...extra };
      return rep;
    } catch (e) {
      playbookLog.error("buildSharedContextFromDomainInput", { message: e instanceof Error ? e.message : String(e) });
      return null;
    }
  },

  buildSharedContextFromPlaybook(params: { playbook: MemoryPlaybook }): SharedContextRepresentation | null {
    try {
      const p = params.playbook;
      const fe = { ...normalizeSharedContext(p.segmentScope), ...normalizeSharedContext(p.marketScope) };
      return toSharedContextRepresentation({
        originDomain: String(p.domain),
        features: fe,
        explicit: p.tags?.length ? { tags: p.tags.join(",") } : {},
        market: p.marketScope,
        segment: p.segmentScope,
      });
    } catch (e) {
      playbookLog.error("buildSharedContextFromPlaybook", { message: e instanceof Error ? e.message : String(e) });
      return null;
    }
  },

  buildSharedContextFromAssignment(params: { assignment: PlaybookAssignment }): SharedContextRepresentation | null {
    try {
      const a = params.assignment;
      return toSharedContextRepresentation({
        originDomain: String(a.domain),
        features: { entityType: a.entityType, segmentKey: a.segmentKey, marketKey: a.marketKey },
        explicit: {},
        market: {},
        segment: {},
      });
    } catch (e) {
      playbookLog.error("buildSharedContextFromAssignment", { message: e instanceof Error ? e.message : String(e) });
      return null;
    }
  },

  async upsertSharedContextIndexEntry(params: {
    domain: MemoryDomain;
    sourceType: string;
    sourceId: string;
    playbookId?: string | null;
    playbookVersionId?: string | null;
    shared: SharedContextRepresentation;
    segmentKey?: string | null;
    marketKey?: string | null;
    scoreBand?: PlaybookScoreBand | null;
  }): Promise<string | null> {
    try {
      const sharedFeatures = { ...params.shared.features, ...params.shared.explicitPreferences };
      const signature = buildSharedSignature({
        ...params.shared,
        features: sharedFeatures,
      });
      const row = await prisma.playbookSharedContextIndex.upsert({
        where: {
          sourceType_sourceId: { sourceType: params.sourceType, sourceId: params.sourceId },
        },
        create: {
          domain: params.domain,
          sourceType: params.sourceType,
          sourceId: params.sourceId,
          playbookId: params.playbookId ?? undefined,
          playbookVersionId: params.playbookVersionId ?? undefined,
          sharedSignature: signature,
          sharedFeatures: sharedFeatures,
          segmentKey: params.segmentKey ?? undefined,
          marketKey: params.marketKey ?? undefined,
          scoreBand: params.scoreBand ?? undefined,
          isActive: true,
          lastUsedAt: new Date(),
        },
        update: {
          sharedSignature: signature,
          sharedFeatures: sharedFeatures,
          playbookId: params.playbookId ?? undefined,
          playbookVersionId: params.playbookVersionId ?? undefined,
          lastUsedAt: new Date(),
          isActive: true,
          scoreBand: params.scoreBand ?? undefined,
          segmentKey: params.segmentKey ?? undefined,
          marketKey: params.marketKey ?? undefined,
        },
      });
      return row.id;
    } catch (e) {
      playbookLog.error("upsertSharedContextIndexEntry", { message: e instanceof Error ? e.message : String(e) });
      return null;
    }
  },

  /**
   * Fire-and-forget index from a playbook id (no throw).
   */
  async tryIndexFromPlaybookId(playbookId: string): Promise<void> {
    try {
      const pb = await prisma.memoryPlaybook.findUnique({ where: { id: playbookId } });
      if (!pb) {
        return;
      }
      if (pb.status !== "ACTIVE") {
        return;
      }
      const sh = playbookSharedContextService.buildSharedContextFromPlaybook({ playbook: pb });
      if (!sh) {
        return;
      }
      await playbookSharedContextService.upsertSharedContextIndexEntry({
        domain: pb.domain,
        sourceType: "memory_playbook",
        sourceId: pb.id,
        playbookId: pb.id,
        playbookVersionId: pb.currentVersionId,
        shared: sh,
        segmentKey: null,
        marketKey: null,
        scoreBand: pb.scoreBand,
      });
    } catch (e) {
      playbookLog.warn("tryIndexFromPlaybookId", { message: e instanceof Error ? e.message : String(e) });
    }
  },
};
