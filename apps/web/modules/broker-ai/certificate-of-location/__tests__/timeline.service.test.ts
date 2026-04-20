import { describe, expect, it, vi } from "vitest";
import { buildCertificateTimelineSignals } from "../certificate-of-location-timeline.service";
import { CERTIFICATE_LOCATION_V2_CONFIG } from "../certificate-of-location-v2.config";
import type { CertificateOfLocationContext } from "../certificate-of-location.types";

describe("buildCertificateTimelineSignals", () => {
  it("flags when property changed after certificate", () => {
    const ctx: CertificateOfLocationContext = { listingId: "x", changedSinceCertificate: true };
    const ts = buildCertificateTimelineSignals({}, ctx);
    expect(ts.flaggedAsPotentiallyOutdated).toBe(true);
  });

  it("flags very old issue dates", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-01-01T12:00:00Z"));
    const old = new Date("2030-01-01");
    old.setUTCDate(old.getUTCDate() - (CERTIFICATE_LOCATION_V2_CONFIG.outdatedAgeDaysStrong + 1));
    const iso = old.toISOString().slice(0, 10);
    const ts = buildCertificateTimelineSignals({ issueDate: iso }, { listingId: "x" });
    expect(ts.hasIssueDate).toBe(true);
    expect(ts.estimatedAgeDays).toBeGreaterThan(CERTIFICATE_LOCATION_V2_CONFIG.outdatedAgeDaysStrong - 2);
    expect(ts.flaggedAsPotentiallyOutdated).toBe(true);
    vi.useRealTimers();
  });

  it("never throws", () => {
    const ts = buildCertificateTimelineSignals({ issueDate: "not-a-date" }, { listingId: "" });
    expect(ts).toHaveProperty("hasIssueDate");
  });
});
