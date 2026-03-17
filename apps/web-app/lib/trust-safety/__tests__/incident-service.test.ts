/**
 * Tests for Trust & Safety incident creation, severity, and escalation.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createIncident, escalateIncident, addIncidentEvidence } from "@/lib/trust-safety/incident-service";

vi.mock("@/lib/db", () => ({
  prisma: {
    trustSafetyIncident: {
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
    },
    trustSafetyEvidence: { create: vi.fn() },
  },
}));

vi.mock("@/lib/trust-safety/notifications", () => ({ notifyTrustSafety: vi.fn() }));

const { prisma } = await import("@/lib/db");

describe("Trust & Safety incident service", () => {
  beforeEach(() => {
    vi.mocked(prisma.trustSafetyIncident.create).mockResolvedValue({
      id: "inc1",
      reporterId: "u1",
      accusedUserId: null,
      listingId: null,
      bookingId: null,
      incidentCategory: "unsafe_property",
      severityLevel: "EMERGENCY",
      riskScore: null,
      riskLevel: null,
      status: "SUBMITTED",
      urgencyLevel: "emergency",
      description: "Test",
      incidentTime: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      resolvedAt: null,
      resolvedBy: null,
      resolutionNotes: null,
    } as never);
    vi.mocked(prisma.trustSafetyIncident.update).mockResolvedValue({} as never);
    vi.mocked(prisma.trustSafetyEvidence.create).mockResolvedValue({ id: "ev1" } as never);
  });

  describe("createIncident", () => {
    it("creates incident with category and default severity from category", async () => {
      const { incidentId } = await createIncident({
        reporterId: "u1",
        incidentCategory: "unsafe_property",
        description: "Property is unsafe",
      });
      expect(incidentId).toBe("inc1");
      expect(prisma.trustSafetyIncident.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            incidentCategory: "unsafe_property",
            severityLevel: "EMERGENCY",
            urgencyLevel: "emergency",
            status: "SUBMITTED",
          }),
        })
      );
    });

    it("uses other when category not in list", async () => {
      await createIncident({
        reporterId: "u1",
        incidentCategory: "unknown_cat",
        description: "Something",
      });
      expect(prisma.trustSafetyIncident.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ incidentCategory: "other" }),
        })
      );
    });
  });

  describe("escalateIncident", () => {
    it("updates status to ESCALATED", async () => {
      await escalateIncident("inc1", "admin1");
      expect(prisma.trustSafetyIncident.update).toHaveBeenCalledWith({
        where: { id: "inc1" },
        data: { status: "ESCALATED", updatedAt: expect.any(Date) },
      });
    });
  });

  describe("addIncidentEvidence", () => {
    beforeEach(() => {
      vi.mocked(prisma.trustSafetyEvidence.create).mockResolvedValue({ id: "ev1" } as never);
    });

    it("creates evidence and returns id", async () => {
      const id = await addIncidentEvidence({
        incidentId: "inc1",
        fileUrl: "https://example.com/photo.jpg",
        fileType: "photo",
        uploadedBy: "u1",
      });
      expect(id).toBe("ev1");
      expect(prisma.trustSafetyEvidence.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            incidentId: "inc1",
            fileUrl: "https://example.com/photo.jpg",
            fileType: "photo",
            uploadedBy: "u1",
          }),
        })
      );
    });
  });
});
