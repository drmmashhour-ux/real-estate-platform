import { playbookLog } from "@/modules/playbook-memory/playbook-memory.logger";
import { getRecommendationsWithSource } from "@/modules/playbook-memory/services/playbook-memory-retrieval.service";
import { playbookMemoryRecommendationService } from "@/modules/playbook-memory/services/playbook-memory-recommendation.service";
import type { PlaybookRecommendation, RetrievalContextInput } from "@/modules/playbook-memory/types/playbook-memory.types";
import type { CrossDomainIntelligenceResult } from "../shared/shared-context.types";
import { toRecommendationRequestContextFromRetrieval } from "./orchestrator-context";
import { playbookSharedContextService } from "./playbook-shared-context.service";
import { playbookCrossDomainRetrievalService } from "./playbook-cross-domain-retrieval.service";

const NATIVE_STRONG = 0.44;

function tagNative(recs: PlaybookRecommendation[]) {
  for (const n of recs) {
    n.intelligenceSource = "native";
    n.crossDomainMetadata = undefined;
  }
  return recs;
}

function mergeByPlaybookId(native: PlaybookRecommendation[], transfer: PlaybookRecommendation[]): PlaybookRecommendation[] {
  const m = new Map<string, PlaybookRecommendation>();
  for (const n of native) {
    m.set(n.playbookId, n);
  }
  for (const t of transfer) {
    const cur = m.get(t.playbookId);
    if (!cur || t.score > cur.score) {
      m.set(t.playbookId, t);
    }
  }
  return Array.from(m.values()).sort((a, b) => b.score - a.score);
}

export const playbookIntelligenceOrchestratorService = {
  async getIntelligentRecommendations(input: RetrievalContextInput): Promise<CrossDomainIntelligenceResult> {
    try {
      const req = toRecommendationRequestContextFromRetrieval(input);
      const requestShared = await playbookSharedContextService.buildSharedContextFromDomainInput({ context: req });
      const native = await playbookMemoryRecommendationService.getPlaybookRecommendations(req);
      const allowedN = native.filter(
        (r): r is PlaybookRecommendation => r.itemType === "playbook" && r.allowed,
      );
      const best = allowedN[0];
      if (best && best.score >= NATIVE_STRONG) {
        tagNative(native);
        playbookLog.info("orchestrator", { path: "native_strong", domain: req.domain });
        return { recommendations: native, source: "native_only" as const, transferUsed: false };
      }

      const cross = await playbookCrossDomainRetrievalService.getCrossDomainCandidates({
        request: req,
        requestShared,
        maxCrossPerDomain: 4,
      });
      const transfer = cross.crossCandidates.map((c) => c.playbook).filter((p) => p.allowed);
      if (transfer.length) {
        const merged = mergeByPlaybookId(allowedN, transfer);
        const out = merged.slice(0, 8);
        const src: CrossDomainIntelligenceResult["source"] =
          allowedN.length > 0 ? "native_plus_transfer" : "transfer_fallback";
        playbookLog.info("orchestrator", { path: src, domain: req.domain, transfer: transfer.length });
        return { recommendations: out, source: src, transferUsed: true };
      }
      if (native.length) {
        tagNative(native);
        return { recommendations: native, source: "native_only" as const, transferUsed: false };
      }
      const fb = await getRecommendationsWithSource(input);
      const s: CrossDomainIntelligenceResult["source"] =
        fb.source === "memory_fallback" ? "memory_fallback" : "none";
      return { recommendations: fb.recommendations, source: s, transferUsed: false };
    } catch (e) {
      playbookLog.error("getIntelligentRecommendations", { message: e instanceof Error ? e.message : String(e) });
      const fb = await getRecommendationsWithSource(input);
      return { recommendations: fb.recommendations, source: "none" as const, transferUsed: false };
    }
  },
};
