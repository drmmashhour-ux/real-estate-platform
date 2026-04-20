/**
 * Syria preview policy — deterministic rules from observation facts + synthetic signals (read-only).
 *
 * Canonical matrix (first matching rule wins; see implementation for ordering + edge cases):
 *
 * | Signal | Result |
 * | --- | --- |
 * | `fraudFlag = true` (fact) | `requires_local_approval` |
 * | listing pending review (`syriaListingStatus` / `pending_review` variants) | `requires_local_approval` |
 * | payout inconsistency (`payout_anomaly`) | `caution_preview` **or** `requires_local_approval` if severity threshold met |
 * | weak bookings / inactive listing signals | `caution_preview` |
 * | unsupported feature / adapter disabled (`unsupportedRegionFeature`, `adapterDisabled`) | `blocked_for_region` |
 * | otherwise | `allow_preview` |
 *
 * Also evaluated: any **critical** severity synthetic signal → `requires_local_approval`; first **warning** after above → `caution_preview`.
 */
import type { ObservationSnapshot } from "@/modules/autonomous-marketplace/types/domain.types";
import type { SyriaPreviewPolicyResult } from "./syria-policy.types";
import type { SyriaSignal } from "./syria-signal.types";

export type { SyriaPreviewPolicyDecision, SyriaPreviewPolicyResult } from "./syria-policy.types";

/** Severe payout backlog → requires_local_approval; milder anomaly → caution_preview only. */
const PAYOUT_REQUIRES_APPROVAL_PENDING_MIN = 5;

function num(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function str(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}

function bool(v: unknown): boolean | null {
  return typeof v === "boolean" ? v : null;
}

/** Accepts `PENDING_REVIEW`, `pending_review`, etc. */
function isListingPendingReview(raw: unknown): boolean {
  const s = str(raw)?.trim() ?? "";
  if (!s) return false;
  const norm = s.toUpperCase().replace(/\s+/g, "_").replace(/-/g, "_");
  return norm === "PENDING_REVIEW";
}

function extractFacts(observation: ObservationSnapshot | null | undefined): Record<string, unknown> {
  if (!observation?.facts || typeof observation.facts !== "object") return {};
  return observation.facts as Record<string, unknown>;
}

/**
 * Ordered rules — matches docs matrix: unsupported/adapter → fraud → pending review → critical signals → payout tier → weak/inactive → residual warnings → allow.
 * Never throws.
 */
export function evaluateSyriaPreviewPolicyFromSignals(
  signals: SyriaSignal[],
  observation?: ObservationSnapshot | null,
): SyriaPreviewPolicyResult {
  try {
    const facts = extractFacts(observation);

    if (bool(facts.adapterDisabled) === true || bool(facts.unsupportedRegionFeature) === true) {
      return {
        decision: "blocked_for_region",
        rationale:
          bool(facts.unsupportedRegionFeature) === true ?
            "Unsupported feature or scope for Syria preview in this environment."
          : "Syria region adapter is disabled — preview is not available for this listing.",
      };
    }

    const fraudFlag = bool(facts.fraudFlag);
    if (fraudFlag === true) {
      return {
        decision: "requires_local_approval",
        rationale: "fraudFlag=true — local approval required before relying on this preview.",
      };
    }

    if (isListingPendingReview(facts.syriaListingStatus)) {
      return {
        decision: "requires_local_approval",
        rationale: "Listing status is pending review — local approval required.",
      };
    }

    for (const s of signals) {
      if (s.severity === "critical") {
        return {
          decision: "requires_local_approval",
          rationale:
            "Critical synthetic signal present (e.g. fraud pattern); local approval required before relying on this preview.",
        };
      }
    }

    const payoutSig = signals.find((s) => s.type === "payout_anomaly");
    if (payoutSig) {
      const pp = num(payoutSig.contributingMetrics.payoutPending);
      const paid = num(payoutSig.contributingMetrics.payoutPaid);
      const severe =
        pp !== null &&
        pp >= PAYOUT_REQUIRES_APPROVAL_PENDING_MIN &&
        paid !== null &&
        pp > paid + 1;
      if (severe) {
        return {
          decision: "requires_local_approval",
          rationale:
            "Payout inconsistency — pending payouts exceed a conservative severity threshold; local approval required.",
        };
      }
      return {
        decision: "caution_preview",
        rationale:
          "Payout inconsistency detected — treat preview as cautious guidance unless cleared operationally.",
      };
    }

    const weakBookings = signals.some((s) => s.type === "low_booking_activity");
    const inactive = signals.some((s) => s.type === "inactive_listing");
    if (weakBookings || inactive) {
      return {
        decision: "caution_preview",
        rationale:
          weakBookings && inactive ?
            "Weak booking activity and non-published/inactive listing posture — cautious guidance only."
          : weakBookings ?
            "Weak booking activity relative to expectations — cautious guidance only."
          : "Listing is not in an active published state — cautious guidance only.",
      };
    }

    for (const s of signals) {
      if (s.severity === "warning") {
        return {
          decision: "caution_preview",
          rationale: "Warning-level synthetic signals present — treat preview output as cautious guidance only.",
        };
      }
    }

    return {
      decision: "allow_preview",
      rationale: "No blocking gates; preview may proceed under normal read-only constraints.",
    };
  } catch {
    return {
      decision: "caution_preview",
      rationale: "Syria preview policy evaluation defaulted to cautious posture.",
    };
  }
}
