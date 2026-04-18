/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, beforeEach } from "vitest";
import {
  recordLeadFormStart,
  recordLeadSubmit,
  recordListingCtaClick,
  getConversionMonitoringSnapshot,
  resetConversionMonitoringForTests,
} from "@/modules/conversion/conversion-monitoring.service";

describe("conversion-monitoring.service (client semantics)", () => {
  beforeEach(() => {
    resetConversionMonitoringForTests();
    sessionStorage.clear();
  });

  it("records lead form start once per session key", () => {
    recordLeadFormStart({ surface: "get-leads", intent: "buy" });
    recordLeadFormStart({ surface: "get-leads", intent: "buy" });
    expect(getConversionMonitoringSnapshot().leadFormStarts).toBe(1);
  });

  it("skips lead submit without surface", () => {
    recordLeadSubmit({});
    expect(getConversionMonitoringSnapshot().leadSubmits).toBe(0);
    recordLeadSubmit({ surface: "get-leads", intent: "buy" });
    expect(getConversionMonitoringSnapshot().leadSubmits).toBe(1);
  });

  it("requires listingId for listing CTA", () => {
    recordListingCtaClick({ surface: "lecipm_grid" });
    expect(getConversionMonitoringSnapshot().listingCtaClicks).toBe(0);
    recordListingCtaClick({ surface: "lecipm_grid", listingId: "abc" });
    expect(getConversionMonitoringSnapshot().listingCtaClicks).toBe(1);
  });
});
