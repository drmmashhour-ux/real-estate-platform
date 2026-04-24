import { createHash } from "node:crypto";
import type { RankingContext } from "@/lib/marketplace-ranking/ranking.types";

function sortKeysDeep(value: unknown): unknown {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  const obj = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(obj).sort()) {
    out[k] = sortKeysDeep(obj[k]);
  }
  return out;
}

export function hashRankingContext(ctx: RankingContext, cohort?: string | null): string {
  const payload = {
    ...ctx,
    _cohort: cohort ?? process.env.RANKING_ALGO_COHORT ?? "baseline",
  };
  const canonical = JSON.stringify(sortKeysDeep(payload));
  return createHash("sha256").update(canonical).digest("hex").slice(0, 32);
}
