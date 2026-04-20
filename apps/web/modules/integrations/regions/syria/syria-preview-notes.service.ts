/**
 * Augments Syria preview note lines with signal and policy context — deterministic, no throws.
 */
import type { SyriaPreviewPolicyResult } from "./syria-policy.types";
import type { SyriaSignal } from "./syria-signal.types";

function uniqPreserveOrder(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const x of items) {
    if (seen.has(x)) continue;
    seen.add(x);
    out.push(x);
  }
  return out;
}

export function buildSyriaPreviewNoteLines(
  baseNotes: readonly string[],
  signals: SyriaSignal[],
  policy: SyriaPreviewPolicyResult,
): string[] {
  const extra: string[] = [];

  if (policy.decision === "blocked_for_region") {
    extra.push("Preview unavailable or blocked for this regional scope.");
  } else if (policy.decision === "requires_local_approval") {
    extra.push("Manual review recommended due to risk signals.");
  } else if (policy.decision === "caution_preview") {
    extra.push("Preview flagged with caution-level signals.");
  }

  for (const s of signals) {
    if (s.type === "low_booking_activity") {
      extra.push("Low booking activity detected.");
    }
    if (s.type === "potential_fraud_pattern") {
      extra.push("Risk indicators present in supplied Syria metrics.");
    }
    if (s.type === "listing_stale") {
      extra.push("Stale listing update pattern detected.");
    }
    if (s.type === "review_backlog") {
      extra.push("Listing remains in pending review.");
    }
    if (s.type === "payout_anomaly") {
      extra.push("Payout imbalance hints detected.");
    }
  }

  return uniqPreserveOrder([...baseNotes, ...extra]);
}
