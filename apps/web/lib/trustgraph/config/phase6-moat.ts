import { z } from "zod";

const num = (v: string | undefined, fallback: number) => {
  const n = v != null && v !== "" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : fallback;
};

const phase6MoatConfigSchema = z.object({
  extraction: z.object({
    minConfidenceForAutoUse: z.number().min(0).max(1),
    reviewRequiredBelowConfidence: z.number().min(0).max(1),
    engineVersion: z.string(),
  }),
  geospatial: z.object({
    minPrecisionScore: z.number(),
    weakPrecisionWarningBelow: z.number(),
  }),
  media: z.object({
    minExteriorConfidence: z.number(),
    minStreetContextConfidence: z.number(),
    classificationEngineVersion: z.string(),
  }),
  antifraud: z.object({
    minEdgeConfidence: z.number(),
    clusterReviewThreshold: z.number(),
    maxEdgesPerRecompute: z.number(),
  }),
  premium: z.object({
    minTrustScore: z.number(),
    requireNoCriticalSignals: z.boolean(),
  }),
  safePublicLabels: z.object({
    addressReview: z.string(),
    mediaReview: z.string(),
    upgradeToPremium: z.string(),
  }),
});

export type Phase6MoatConfig = z.infer<typeof phase6MoatConfigSchema>;

export function getPhase6MoatConfig(): Phase6MoatConfig {
  const raw: Phase6MoatConfig = {
    extraction: {
      minConfidenceForAutoUse: num(process.env.TRUSTGRAPH_EXTRACTION_MIN_CONFIDENCE, 0.72),
      reviewRequiredBelowConfidence: num(process.env.TRUSTGRAPH_EXTRACTION_REVIEW_BELOW, 0.45),
      engineVersion: process.env.TRUSTGRAPH_EXTRACTION_ENGINE_VERSION?.trim() || "stub-v1",
    },
    geospatial: {
      minPrecisionScore: num(process.env.TRUSTGRAPH_GEO_MIN_PRECISION, 0.55),
      weakPrecisionWarningBelow: num(process.env.TRUSTGRAPH_GEO_WEAK_BELOW, 0.4),
    },
    media: {
      minExteriorConfidence: num(process.env.TRUSTGRAPH_MEDIA_MIN_EXTERIOR, 0.5),
      minStreetContextConfidence: num(process.env.TRUSTGRAPH_MEDIA_MIN_STREET, 0.35),
      classificationEngineVersion: process.env.TRUSTGRAPH_MEDIA_CLASSIFIER_VERSION?.trim() || "stub-v1",
    },
    antifraud: {
      minEdgeConfidence: num(process.env.TRUSTGRAPH_GRAPH_MIN_EDGE_CONF, 0.35),
      clusterReviewThreshold: num(process.env.TRUSTGRAPH_GRAPH_CLUSTER_REVIEW, 3),
      maxEdgesPerRecompute: Math.floor(num(process.env.TRUSTGRAPH_GRAPH_MAX_EDGES, 500)),
    },
    premium: {
      minTrustScore: num(process.env.TRUSTGRAPH_PREMIUM_MIN_TRUST_SCORE, 65),
      requireNoCriticalSignals: process.env.TRUSTGRAPH_PREMIUM_ALLOW_CRITICAL !== "true",
    },
    safePublicLabels: {
      addressReview: "Address verification in progress",
      mediaReview: "Photo review suggested",
      upgradeToPremium: "Complete verification to unlock premium placement",
    },
  };
  return phase6MoatConfigSchema.parse(raw);
}
