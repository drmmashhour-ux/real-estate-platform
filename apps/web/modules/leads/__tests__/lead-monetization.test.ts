import { describe, expect, it, beforeEach } from "vitest";
import {
  computeLeadUnlockPrice,
  inferLeadIntentLabel,
  maskLeadDisplayName,
  redactLeadMessagePreview,
} from "@/modules/leads/lead-monetization.service";
import {
  getLeadMonetizationMonitoringSnapshot,
  recordLeadMonetizationView,
  recordLeadUnlockAttempt,
  recordLeadMonetizationUnlocked,
  resetLeadMonetizationMonitoringForTests,
} from "@/modules/leads/lead-monetization-monitoring.service";

const bounds = {
  minCents: 500,
  maxCents: 50_000,
  defaultLeadPriceCents: 2900,
};

describe("lead monetization V1", () => {
  beforeEach(() => {
    resetLeadMonetizationMonitoringForTests();
  });

  describe("maskLeadDisplayName", () => {
    it("masks multi-word names to initials", () => {
      expect(maskLeadDisplayName("Jane Doe")).toBe("J. Doe");
    });
    it("masks single-word names", () => {
      expect(maskLeadDisplayName("Madonna")).toBe("M.");
    });
    it("handles empty input", () => {
      expect(maskLeadDisplayName("   ")).toBe("Prospect");
    });
  });

  describe("redactLeadMessagePreview", () => {
    it("removes email-like tokens", () => {
      const s = redactLeadMessagePreview("Reach me at user@example.com thanks");
      expect(s).not.toMatch(/@/);
      expect(s).toContain("[redacted]");
    });
    it("removes phone-like tokens", () => {
      const s = redactLeadMessagePreview("Call +1 514 555 0100");
      expect(s).toContain("[redacted]");
    });
    it("returns empty for blank", () => {
      expect(redactLeadMessagePreview(null)).toBe("");
    });
  });

  describe("inferLeadIntentLabel", () => {
    it("detects invest", () => {
      expect(inferLeadIntentLabel({ message: "ROI on a plex" })).toBe("invest");
    });
    it("detects rent", () => {
      expect(inferLeadIntentLabel({ message: "looking to lease" })).toBe("rent");
    });
    it("detects buy", () => {
      expect(inferLeadIntentLabel({ message: "want to buy soon" })).toBe("buy");
    });
    it("defaults to other", () => {
      expect(inferLeadIntentLabel({ message: "hello" })).toBe("other");
    });
  });

  describe("computeLeadUnlockPrice", () => {
    it("is deterministic for same inputs", () => {
      const lead = {
        message: "buyer high intent",
        leadSource: "web",
        leadType: "broker_consultation",
        score: 80,
        engagementScore: 10,
        interactionCount: 2,
        hasCompleteContact: true,
      };
      const a = computeLeadUnlockPrice(lead, bounds);
      const b = computeLeadUnlockPrice(lead, bounds);
      expect(a.leadPriceCents).toBe(b.leadPriceCents);
      expect(a.leadPrice).toBe(b.leadPrice);
    });
    it("respects min/max cents bounds", () => {
      const low = computeLeadUnlockPrice(
        { score: 0, message: "", interactionCount: 0, hasCompleteContact: false },
        bounds,
      );
      const high = computeLeadUnlockPrice(
        { score: 100, message: "urgent investment duplex", interactionCount: 10, hasCompleteContact: true },
        { ...bounds, maxCents: 999_999 },
      );
      expect(low.leadPriceCents).toBeGreaterThanOrEqual(bounds.minCents);
      expect(high.leadPriceCents).toBeLessThanOrEqual(999_999);
    });
  });

  describe("monitoring", () => {
    it("tracks views, attempts, unlocks and conversion", () => {
      recordLeadMonetizationView();
      recordLeadMonetizationView();
      recordLeadUnlockAttempt();
      recordLeadUnlockAttempt();
      recordLeadMonetizationUnlocked();
      const snap = getLeadMonetizationMonitoringSnapshot();
      expect(snap.leadsViewed).toBe(2);
      expect(snap.unlockAttempts).toBe(2);
      expect(snap.leadsUnlocked).toBe(1);
      expect(snap.unlockConversionRate).toBeGreaterThan(0);
      expect(snap.unlockConversionRate).toBeLessThanOrEqual(1);
    });
  });
});
