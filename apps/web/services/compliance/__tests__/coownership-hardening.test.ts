import { describe, it, expect, vi, beforeEach } from "vitest";
import { 
  getMergedComplianceStatus, 
  setChecklistItemVerification,
  overrideChecklistItemCompliance,
  assertCoownershipEnforcementAllows
} from "../coownershipCompliance.service";
import { prisma } from "@/lib/db";
import { complianceFlags } from "@/config/feature-flags";

vi.mock("@/lib/db", () => ({
  prisma: {
    listing: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    checklistItem: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
      createMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    listingComplianceSnapshot: {
      upsert: vi.fn(),
    },
    coOwnershipAuditLog: {
      create: vi.fn(),
    }
  }
}));

vi.mock("@/config/feature-flags", () => ({
  complianceFlags: {
    coownershipVerificationEnforcement: true,
    coownershipExpiryEnforcement: true,
    coownershipComplianceEnforcement: true,
  }
}));

describe("Co-Ownership Hardening Logic", () => {
  const listingId = "lst_123";
  const mockListing = {
    id: listingId,
    listingType: "CONDO",
    isCoOwnership: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.listing.findUnique as any).mockResolvedValue(mockListing);
  });

  it("should block compliance if critical row is only DECLARED when verification is enforced", async () => {
    (prisma.checklistItem.findMany as any).mockResolvedValue([
      {
        key: "syndicate_property_insurance_verified",
        status: "COMPLETED",
        verificationLevel: "DECLARED",
        isExpired: false,
        isOverridden: false,
        required: true,
      }
    ]);

    const status = await getMergedComplianceStatus(listingId);
    expect(status.insuranceGateComplete).toBe(false);
  });

  it("should allow compliance if critical row is DOCUMENTED", async () => {
    (prisma.checklistItem.findMany as any).mockResolvedValue([
      {
        key: "syndicate_property_insurance_verified",
        status: "COMPLETED",
        verificationLevel: "DOCUMENTED",
        isExpired: false,
        isOverridden: false,
        required: true,
      },
      {
        key: "syndicate_third_party_liability_verified",
        status: "COMPLETED",
        verificationLevel: "DOCUMENTED",
        isExpired: false,
        isOverridden: false,
        required: true,
      },
      {
        key: "coowner_liability_minimum_verified",
        status: "COMPLETED",
        verificationLevel: "DOCUMENTED",
        isExpired: false,
        isOverridden: false,
        required: true,
      }
    ]);

    const status = await getMergedComplianceStatus(listingId);
    expect(status.insuranceGateComplete).toBe(true);
  });

  it("should block compliance if row is expired", async () => {
    (prisma.checklistItem.findMany as any).mockResolvedValue([
      {
        key: "syndicate_property_insurance_verified",
        status: "COMPLETED",
        verificationLevel: "VERIFIED",
        isExpired: true,
        isOverridden: false,
        required: true,
      }
    ]);

    const status = await getMergedComplianceStatus(listingId);
    expect(status.insuranceGateComplete).toBe(false);
  });

  it("should allow compliance if row is overridden by admin", async () => {
    (prisma.checklistItem.findMany as any).mockResolvedValue([
      {
        key: "syndicate_property_insurance_verified",
        status: "COMPLETED",
        verificationLevel: "DECLARED",
        isExpired: true,
        isOverridden: true,
        required: true,
      },
      {
        key: "syndicate_third_party_liability_verified",
        status: "COMPLETED",
        verificationLevel: "DECLARED",
        isExpired: false,
        isOverridden: true,
        required: true,
      },
      {
        key: "coowner_liability_minimum_verified",
        status: "COMPLETED",
        verificationLevel: "DECLARED",
        isExpired: false,
        isOverridden: true,
        required: true,
      }
    ]);

    const status = await getMergedComplianceStatus(listingId);
    expect(status.insuranceGateComplete).toBe(true);
  });

  it("assertCoownershipEnforcementAllows should throw critical error if verification missing (since it fails insurance gate)", async () => {
    (prisma.checklistItem.findMany as any).mockResolvedValue([
      {
        key: "syndicate_property_insurance_verified",
        status: "COMPLETED",
        verificationLevel: "DECLARED",
        isExpired: false,
        isOverridden: false,
        required: true,
      }
    ]);

    await expect(assertCoownershipEnforcementAllows(listingId, "publish"))
      .rejects.toThrow("Critical co-ownership compliance items are missing");
  });
});
