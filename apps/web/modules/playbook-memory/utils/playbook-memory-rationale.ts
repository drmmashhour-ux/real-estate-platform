import type { PlaybookExecutionMode, PlaybookScoreBand } from "@prisma/client";

import type { PolicyGateResult } from "../types/playbook-memory.types";

/** Human-facing rationale lines for recommendations / blocks. */
export function buildRationaleLines(params: {
  rankScore: number;
  domain: string;
  totalExecutions: number;
  scoreBand: PlaybookScoreBand;
  executionMode: PlaybookExecutionMode;
}): string[] {
  return [
    `rank_score=${params.rankScore.toFixed(4)}`,
    `domain=${params.domain}`,
    `executions=${params.totalExecutions}`,
    `score_band=${params.scoreBand}`,
    `mode=${params.executionMode}`,
  ];
}

export function policyBlocksToBlockedReasons(gate: PolicyGateResult): string[] {
  return gate.blockedReasons;
}

export function blocksToRationaleText(blocks: string[]): string[] {
  if (blocks.length === 0) return ["policy_clear"];
  return blocks.map((b) => `blocked:${b}`);
}

/** Wave 3: short lines for memory-record–only recommendations. */
export function buildRationale(input: { similarity: number; recency: number }): string[] {
  const reasons: string[] = [];

  if (input.similarity > 0.7) {
    reasons.push("High similarity with past successful context");
  }

  if (input.recency > 0.7) {
    reasons.push("Recent successful pattern");
  }

  if (reasons.length === 0) {
    reasons.push("Moderate match with historical data");
  }

  return reasons;
}
