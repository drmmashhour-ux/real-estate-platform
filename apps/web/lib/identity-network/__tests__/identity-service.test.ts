import { describe, it, expect, vi, beforeEach } from "vitest";
import { createOwnerIdentity, createBrokerIdentity, createOrganizationIdentity } from "../identity-service";

vi.mock("@/lib/db", () => ({
  prisma: {
    ownerIdentity: {
      create: vi.fn(),
    },
    brokerIdentity: {
      create: vi.fn(),
    },
    organizationIdentity: {
      create: vi.fn(),
    },
  },
}));

const { prisma } = await import("@/lib/db");

describe("identity-service create", () => {
  beforeEach(() => {
    vi.mocked(prisma.ownerIdentity.create).mockReset();
    vi.mocked(prisma.brokerIdentity.create).mockReset();
    vi.mocked(prisma.organizationIdentity.create).mockReset();
  });

  it("createOwnerIdentity collapses spaces in legal name and normalizes for matching", async () => {
    vi.mocked(prisma.ownerIdentity.create).mockResolvedValue({
      id: "oid-1",
      legalName: "Jean Dupont",
      normalizedName: "jean dupont",
      verificationStatus: "PENDING",
      primarySource: null,
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const result = await createOwnerIdentity({
      legalName: "  Jean   Dupont  ",
      primarySource: "land_register_extract",
    });
    expect(prisma.ownerIdentity.create).toHaveBeenCalledWith({
      data: {
        legalName: "Jean Dupont",
        normalizedName: "jean dupont",
        primarySource: "land_register_extract",
        verificationStatus: "PENDING",
      },
    });
    expect(result.legalName).toBe("Jean Dupont");
    expect(result.normalizedName).toBe("jean dupont");
  });

  it("createBrokerIdentity normalizes and passes license/brokerage", async () => {
    vi.mocked(prisma.brokerIdentity.create).mockResolvedValue({
      id: "bid-1",
      legalName: "Marie Martin",
      normalizedName: "marie martin",
      licenseNumber: "OACIQ-123",
      brokerageName: "Centris",
      regulatorRef: "OACIQ",
      verificationStatus: "PENDING",
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await createBrokerIdentity({
      legalName: "Marie Martin",
      licenseNumber: "OACIQ-123",
      brokerageName: "Centris",
      regulatorRef: "OACIQ",
    });
    expect(prisma.brokerIdentity.create).toHaveBeenCalledWith({
      data: {
        legalName: "Marie Martin",
        normalizedName: "marie martin",
        licenseNumber: "OACIQ-123",
        brokerageName: "Centris",
        regulatorRef: "OACIQ",
        verificationStatus: "PENDING",
      },
    });
  });

  it("createOrganizationIdentity normalizes and sets type", async () => {
    vi.mocked(prisma.organizationIdentity.create).mockResolvedValue({
      id: "org-1",
      legalName: "Acme Realty Inc.",
      normalizedName: "acme realty inc",
      organizationType: "brokerage",
      verificationStatus: "PENDING",
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await createOrganizationIdentity({
      legalName: "Acme Realty Inc.",
      organizationType: "brokerage",
    });
    expect(prisma.organizationIdentity.create).toHaveBeenCalledWith({
      data: {
        legalName: "Acme Realty Inc.",
        normalizedName: "acme realty inc",
        organizationType: "brokerage",
        verificationStatus: "PENDING",
      },
    });
  });
});
