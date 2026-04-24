import { describe, expect, it, vi, beforeEach } from "vitest";
import { validateFormSchema } from "../form-schema";
import { validateAIOutput } from "../ai-output";
import { LECIPM_CRITICAL_NOTICE_IDS } from "../critical-notices";

vi.mock("@/lib/db", () => ({
  prisma: {
    complianceScore: { findFirst: vi.fn() },
    listing: { findUnique: vi.fn() },
    platformPayment: { findFirst: vi.fn() },
    lecipmProductionGuardNoticeAck: { findMany: vi.fn() },
    lecipmProductionGuardAuditEvent: { create: vi.fn() },
    lecipmProductionGuardArtifact: { create: vi.fn() },
  },
}));

import { prisma } from "@/lib/db";
import { validateBeforeSignature } from "../signature-gate";

describe("validateFormSchema", () => {
  it("rejects unknown form keys (no free-form AI structure)", () => {
    const r = validateFormSchema("ai_invented_form", "1", {});
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0]).toContain("Unknown form schema");
  });

  it("rejects invalid payload for locked registry", () => {
    const r = validateFormSchema("lecipm_brokerage_ack", "2026-04-01", { brokerLicenseNumber: "x" });
    expect(r.ok).toBe(false);
  });

  it("accepts valid payload", () => {
    const r = validateFormSchema("lecipm_brokerage_ack", "2026-04-01", {
      brokerLicenseNumber: "1234",
      agencyName: "Test Agency",
      agency_relationship_summary: "x".repeat(25),
    });
    expect(r.ok).toBe(true);
  });
});

describe("validateAIOutput", () => {
  it("rejects excessive shortening of immutable clause text", () => {
    const base = {
      brokerLicenseNumber: "1234",
      agencyName: "Agency",
      agency_relationship_summary: "x".repeat(80),
    };
    const r = validateAIOutput({
      formKey: "lecipm_brokerage_ack",
      version: "2026-04-01",
      baseFacts: base,
      aiPatch: { agency_relationship_summary: "x".repeat(10) },
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.some((e) => e.includes("shortened"))).toBe(true);
  });
});

describe("validateBeforeSignature (bypass protection)", () => {
  beforeEach(() => {
    vi.mocked(prisma.complianceScore.findFirst).mockResolvedValue({ score: 90 } as never);
    vi.mocked(prisma.listing.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.platformPayment.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.lecipmProductionGuardNoticeAck.findMany).mockResolvedValue(
      LECIPM_CRITICAL_NOTICE_IDS.map((noticeId) => ({ noticeId })) as never,
    );
    vi.mocked(prisma.lecipmProductionGuardAuditEvent.create).mockResolvedValue({} as never);
  });

  it("blocks when compliance score is below threshold", async () => {
    vi.mocked(prisma.complianceScore.findFirst).mockResolvedValue({ score: 10 } as never);
    vi.mocked(prisma.listing.findUnique).mockResolvedValue({ complianceScore: 10 } as never);
    const gate = await validateBeforeSignature({
      deal: {
        id: "deal-1",
        brokerId: "b1",
        listingId: "l1",
        executionMetadata: {},
      },
      userId: "u1",
    });
    expect(gate.ok).toBe(false);
    if (!gate.ok) expect(gate.blockingReasons).toContain("COMPLIANCE_BELOW_THRESHOLD");
  });

  it("blocks when critical notices are not acknowledged", async () => {
    vi.mocked(prisma.lecipmProductionGuardNoticeAck.findMany).mockResolvedValue([] as never);
    const gate = await validateBeforeSignature({
      deal: { id: "deal-1", brokerId: "b1", listingId: null, executionMetadata: {} },
      userId: "u1",
    });
    expect(gate.ok).toBe(false);
    if (!gate.ok) expect(gate.blockingReasons).toContain("CRITICAL_NOTICES_INCOMPLETE");
  });
});
