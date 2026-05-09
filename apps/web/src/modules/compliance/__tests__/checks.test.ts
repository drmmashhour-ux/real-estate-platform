import { describe, expect, it } from "vitest";
import { canPublishListing, requiresBrokerReview, blockingReasons, auditSeverity } from "../server/checks";

describe("Compliance Engine", () => {
  it("canPublishListing returns placeholder checks", () => {
    const result = canPublishListing("test-listing-id");
    expect(result.checks.length).toBeGreaterThan(0);
    for (const check of result.checks) {
      expect(check.isPlaceholder).toBe(true);
    }
  });

  it("requiresBrokerReview returns true for regulated actions", () => {
    expect(requiresBrokerReview("accept_offer")).toBe(true);
    expect(requiresBrokerReview("sign_contract")).toBe(true);
  });

  it("requiresBrokerReview returns false for non-reviewed actions", () => {
    expect(requiresBrokerReview("publish_listing")).toBe(false);
  });

  it("blockingReasons returns blocking state for unknown regulated action", () => {
    const reasons = blockingReasons("process_payment");
    expect(reasons.length).toBeGreaterThan(0);
    expect(reasons[0]).toContain("TODO_COMPLIANCE_VERIFY");
  });

  it("auditSeverity assigns correct levels", () => {
    expect(auditSeverity("process_payment")).toBe("critical");
    expect(auditSeverity("publish_listing")).toBe("warning");
  });
});
