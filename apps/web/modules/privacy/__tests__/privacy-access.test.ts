import { describe, expect, it, vi, beforeEach } from "vitest";
import { PrivacyAccessService, PrivacyRole } from "../services/privacy-access.service";
import { prisma } from "@/lib/db";
import { PrivacySensitivityLevel } from "@prisma/client";

vi.mock("@/lib/db", () => ({
  prisma: {
    transactionDocument: {
      findUnique: vi.fn(),
    },
    privacyTransferLog: {
      create: vi.fn(),
    },
    privacyAuditLog: {
      create: vi.fn(),
    },
  },
}));

describe("PrivacyAccessService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should allow ADMIN to access any document", async () => {
    (prisma.transactionDocument.findUnique as any).mockResolvedValue({
      id: "doc-1",
      sensitivityLevel: PrivacySensitivityLevel.HIGHLY_SENSITIVE,
      transaction: { brokerId: "other-broker" },
    });

    const result = await PrivacyAccessService.canAccessDocument({
      userId: "admin-1",
      userRole: "ADMIN",
      documentId: "doc-1",
    });

    expect(result).toBe(true);
  });

  it("should deny access to unrelated broker for sensitive document", async () => {
    (prisma.transactionDocument.findUnique as any).mockResolvedValue({
      id: "doc-1",
      sensitivityLevel: PrivacySensitivityLevel.CONFIDENTIAL,
      transaction: { brokerId: "owner-broker" },
      allowedRoles: [],
    });

    const result = await PrivacyAccessService.canAccessDocument({
      userId: "other-broker",
      userRole: "BROKER",
      documentId: "doc-1",
    });

    expect(result).toBe(false);
  });

  it("should allow access to the broker on the transaction", async () => {
    (prisma.transactionDocument.findUnique as any).mockResolvedValue({
      id: "doc-1",
      sensitivityLevel: PrivacySensitivityLevel.CONFIDENTIAL,
      transaction: { brokerId: "owner-broker" },
    });

    const result = await PrivacyAccessService.canAccessDocument({
      userId: "owner-broker",
      userRole: "BROKER",
      documentId: "doc-1",
    });

    expect(result).toBe(true);
  });
});
