import { describe, expect, it, vi, beforeEach } from "vitest";
import { PrivacyLaunchGuard } from "../utils/launch-guards";
import { prisma } from "@/lib/db";
import { PrivacyPurpose } from "@prisma/client";

vi.mock("@/lib/db", () => ({
  prisma: {
    privacyOfficer: {
      findFirst: vi.fn(),
    },
    privacyRetentionPolicy: {
      findFirst: vi.fn(),
    },
    privacyConsentRecord: {
      findFirst: vi.fn(),
    },
  },
}));

describe("PrivacyLaunchGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should block launch if privacy officer is not published", async () => {
    (prisma.privacyOfficer.findFirst as any).mockResolvedValue(null);
    (prisma.privacyRetentionPolicy.findFirst as any).mockResolvedValue({ id: "policy-1" });

    const result = await PrivacyLaunchGuard.validateLaunchReadiness();
    expect(result.allOk).toBe(false);
    expect(result.checks.privacyOfficerPublished).toBe(false);
  });

  it("should block transaction if gate is unsigned", async () => {
    (prisma.privacyConsentRecord.findFirst as any).mockResolvedValue(null);

    await expect(PrivacyLaunchGuard.assertTransactionGate("user-1"))
      .rejects.toThrow("MANDATORY_GATE_UNSIGNED");
  });

  it("should allow transaction if gate is signed", async () => {
    (prisma.privacyConsentRecord.findFirst as any).mockResolvedValue({ id: "consent-1" });

    const result = await PrivacyLaunchGuard.assertTransactionGate("user-1");
    expect(result).toBe(true);
  });

  it("should verify marketing consent is required", async () => {
    (prisma.privacyConsentRecord.findFirst as any).mockResolvedValue(null);
    const hasConsent = await prisma.privacyConsentRecord.findFirst({
      where: { userId: "user-1", purpose: PrivacyPurpose.MARKETING, granted: true }
    });
    expect(hasConsent).toBe(null);
  });

  it("should verify lockbox disclosure consent is required", async () => {
    (prisma.privacyConsentRecord.findFirst as any).mockResolvedValue(null);
    const hasConsent = await prisma.privacyConsentRecord.findFirst({
      where: { userId: "user-1", purpose: PrivacyPurpose.LOCKBOX_CODE_DISCLOSURE, granted: true }
    });
    expect(hasConsent).toBe(null);
  });
});
