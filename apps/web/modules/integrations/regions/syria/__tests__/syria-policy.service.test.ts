import { describe, expect, it } from "vitest";
import { evaluateSyriaPreviewPolicyFromSignals } from "../syria-policy.service";
import type { ObservationSnapshot } from "@/modules/autonomous-marketplace/types/domain.types";

const obs = (facts: Record<string, unknown>): ObservationSnapshot =>
  ({
    id: "o",
    target: { type: "syria_listing", id: "x", label: "" },
    signals: [],
    aggregates: {},
    facts,
    builtAt: new Date().toISOString(),
  }) as ObservationSnapshot;

describe("evaluateSyriaPreviewPolicyFromSignals", () => {
  it("blocked_for_region when adapter disabled fact", () => {
    const r = evaluateSyriaPreviewPolicyFromSignals([], obs({ adapterDisabled: true }));
    expect(r.decision).toBe("blocked_for_region");
  });

  it("requires_local_approval when fraudFlag=true on observation", () => {
    const r = evaluateSyriaPreviewPolicyFromSignals([], obs({ syriaListingStatus: "PUBLISHED", fraudFlag: true }));
    expect(r.decision).toBe("requires_local_approval");
  });

  it("requires_local_approval when listing status pending review (facts)", () => {
    const r = evaluateSyriaPreviewPolicyFromSignals([], obs({ syriaListingStatus: "PENDING_REVIEW", fraudFlag: false }));
    expect(r.decision).toBe("requires_local_approval");
  });

  it("requires_local_approval when listing status pending_review string", () => {
    const r = evaluateSyriaPreviewPolicyFromSignals([], obs({ syriaListingStatus: "pending_review", fraudFlag: false }));
    expect(r.decision).toBe("requires_local_approval");
  });

  it("payout anomaly severe → requires_local_approval", () => {
    const r = evaluateSyriaPreviewPolicyFromSignals(
      [
        {
          type: "payout_anomaly",
          severity: "warning",
          message: "",
          contributingMetrics: { payoutPending: 6, payoutPaid: 1 },
        },
      ],
      obs({ syriaListingStatus: "PUBLISHED", fraudFlag: false }),
    );
    expect(r.decision).toBe("requires_local_approval");
  });

  it("payout anomaly mild → caution_preview", () => {
    const r = evaluateSyriaPreviewPolicyFromSignals(
      [
        {
          type: "payout_anomaly",
          severity: "warning",
          message: "",
          contributingMetrics: { payoutPending: 2, payoutPaid: 1 },
        },
      ],
      obs({ syriaListingStatus: "PUBLISHED", fraudFlag: false }),
    );
    expect(r.decision).toBe("caution_preview");
  });

  it("weak bookings / inactive → caution_preview", () => {
    const r = evaluateSyriaPreviewPolicyFromSignals(
      [
        {
          type: "low_booking_activity",
          severity: "info",
          message: "",
          contributingMetrics: {},
        },
      ],
      obs({ syriaListingStatus: "PUBLISHED", fraudFlag: false }),
    );
    expect(r.decision).toBe("caution_preview");
  });

  it("critical signal without fraudFlag fact still requires", () => {
    const r = evaluateSyriaPreviewPolicyFromSignals(
      [
        {
          type: "potential_fraud_pattern",
          severity: "critical",
          message: "",
          contributingMetrics: {},
        },
      ],
      obs({ syriaListingStatus: "PUBLISHED", fraudFlag: false }),
    );
    expect(r.decision).toBe("requires_local_approval");
  });

  it("allow_preview when only benign info signals and clean facts", () => {
    const r = evaluateSyriaPreviewPolicyFromSignals(
      [
        {
          type: "listing_stale",
          severity: "info",
          message: "",
          contributingMetrics: {},
        },
      ],
      obs({ syriaListingStatus: "PUBLISHED", fraudFlag: false }),
    );
    expect(r.decision).toBe("allow_preview");
  });

  it("fraudFlag wins over mild payout when both present", () => {
    const r = evaluateSyriaPreviewPolicyFromSignals(
      [
        {
          type: "payout_anomaly",
          severity: "warning",
          message: "",
          contributingMetrics: { payoutPending: 2, payoutPaid: 1 },
        },
      ],
      obs({ syriaListingStatus: "PUBLISHED", fraudFlag: true }),
    );
    expect(r.decision).toBe("requires_local_approval");
    expect(r.rationale.toLowerCase()).toContain("fraud");
  });
});
