import { describe, expect, it, vi, beforeEach } from "vitest";
import { PrivacyConsentService } from "../services/privacy-consent.service";
import { prisma } from "@/lib/db";
import { PrivacyPurpose } from "@prisma/client";

vi.mock("@/lib/db", () => ({
  prisma: {
    privacyConsentRecord: {
      findFirst: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
    privacyAuditLog: {
      create: vi.fn(),
    },
  },
}));

describe("PrivacyConsentService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should grant consent and log the action", async () => {
    const args = {
      userId: "user-1",
      purpose: PrivacyPurpose.MARKETING,
      scopeText: "Test scope",
      explicit: true,
      written: true,
      legalBasisText: "Test basis",
    };

    (prisma.privacyConsentRecord.create as any).mockResolvedValue({ id: "record-1" });

    await PrivacyConsentService.grantConsent(args);

    expect(prisma.privacyConsentRecord.updateMany).toHaveBeenCalled();
    expect(prisma.privacyConsentRecord.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        userId: "user-1",
        purpose: PrivacyPurpose.MARKETING,
      }),
    }));
    expect(prisma.privacyAuditLog.create).toHaveBeenCalled();
  });

  it("should return true if active consent exists", async () => {
    (prisma.privacyConsentRecord.findFirst as any).mockResolvedValue({ id: "record-1" });

    const result = await PrivacyConsentService.hasActiveConsent({
      userId: "user-1",
      purpose: PrivacyPurpose.TRANSACTION_EXECUTION,
    });

    expect(result).toBe(true);
  });

  it("should throw if required consent is missing", async () => {
    (prisma.privacyConsentRecord.findFirst as any).mockResolvedValue(null);

    await expect(PrivacyConsentService.requireConsent({
      userId: "user-1",
      purpose: PrivacyPurpose.TRANSACTION_EXECUTION,
    })).rejects.toThrow("Consent missing");
  });
});
