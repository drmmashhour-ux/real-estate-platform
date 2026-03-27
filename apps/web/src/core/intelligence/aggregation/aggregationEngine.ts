import { buildExplanation } from "@/src/core/intelligence/explanation/explanationEngine";
import { computeScores } from "@/src/core/intelligence/scoring/scoringEngine";
import { selectBestActionsFromScores, selectBestStrategiesFromScores } from "@/src/core/intelligence/selection/selectionEngine";
import { buildLeadSignals, buildListingSignals } from "@/src/core/intelligence/signals/signalsEngine";
import type { LeadSignalInput, ListingSignalInput, SelectionItem, UnifiedIntelligence } from "@/src/core/intelligence/types/intelligence.types";

const memoryCache = new Map<string, { expiresAt: number; value: UnifiedIntelligence }>();

function getCache(key: string): UnifiedIntelligence | null {
  const hit = memoryCache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return hit.value;
}

function setCache(key: string, value: UnifiedIntelligence, ttlMs = 120_000) {
  memoryCache.set(key, { expiresAt: Date.now() + ttlMs, value });
}

export function aggregateListingIntelligence(args: { cacheKey: string; input: ListingSignalInput; propertySelections?: SelectionItem[]; leadSelections?: SelectionItem[] }): UnifiedIntelligence {
  const cached = getCache(args.cacheKey);
  if (cached) return cached;

  const signals = buildListingSignals(args.input);
  const scores = computeScores(signals);
  const bestActions = selectBestActionsFromScores(args.cacheKey, scores);
  const bestStrategies = selectBestStrategiesFromScores(args.cacheKey, scores, args.input.rentalDemand ?? 50);
  const selection = {
    bestProperties: args.propertySelections ?? [],
    bestLeads: args.leadSelections ?? [],
    bestActions,
    bestStrategies,
  };
  const explanation = buildExplanation({ signals, selection: bestActions });

  const unified: UnifiedIntelligence = {
    signals,
    scores,
    selection,
    explanation,
    confidence: scores.confidenceScore,
  };
  setCache(args.cacheKey, unified);
  return unified;
}

export function aggregateLeadIntelligence(args: { cacheKey: string; input: LeadSignalInput; leadSelections?: SelectionItem[] }): UnifiedIntelligence {
  const cached = getCache(args.cacheKey);
  if (cached) return cached;

  const signals = buildLeadSignals(args.input);
  const scores = computeScores(signals);
  const bestActions = selectBestActionsFromScores(args.cacheKey, scores);

  const unified: UnifiedIntelligence = {
    signals,
    scores,
    selection: {
      bestProperties: [],
      bestLeads: args.leadSelections ?? [],
      bestActions,
      bestStrategies: [],
    },
    explanation: buildExplanation({ signals, selection: bestActions }),
    confidence: scores.confidenceScore,
  };

  setCache(args.cacheKey, unified);
  return unified;
}
