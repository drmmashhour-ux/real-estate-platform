import { describe, expect, it, vi } from "vitest";
import { POST } from "./route";

vi.mock("@/app/api/legal-workflow/_auth", () => ({ requireDocumentAccess: vi.fn() }));
vi.mock("@/lib/db", () => ({
  prisma: {
    sellerDeclarationDraft: { findUnique: vi.fn() },
  },
}));
vi.mock("@/src/modules/case-command-center/application/getCaseLegalSummary", () => ({
  getCaseLegalSummary: vi.fn().mockResolvedValue({
    propertyId: "l1",
    summary: {
      fileHealth: "healthy",
      blockingIssues: [],
      warnings: [],
      missingDependencies: [],
      unresolvedReviewIssues: [],
      criticalOpenCount: 0,
      signatureReadiness: { ready: true, reasons: [] },
      nextActions: [],
    },
  }),
}));

import { requireDocumentAccess } from "@/app/api/legal-workflow/_auth";
import { prisma } from "@/lib/db";
import { getCaseLegalSummary } from "@/src/modules/case-command-center/application/getCaseLegalSummary";
import { LECIPM_WORKFLOW_EVALUATE_FALLBACK } from "@/src/modules/case-command-center/application/lecipmTrustCopy";

describe("POST /api/autonomous-workflow/evaluate", () => {
  it("requires access", async () => {
    vi.mocked(requireDocumentAccess).mockResolvedValue({ ok: false, status: 403, userId: "u1", isAdmin: false });
    const res = await POST(new Request("http://x", { method: "POST", body: JSON.stringify({ documentId: "d1" }) }) as never);
    expect(res.status).toBe(403);
  });

  it("returns steps when document exists", async () => {
    vi.mocked(requireDocumentAccess).mockResolvedValue({ ok: true, status: 200, userId: "u1", isAdmin: true });
    vi.mocked(prisma.sellerDeclarationDraft.findUnique).mockResolvedValue({
      id: "d1",
      listingId: "l1",
      status: "draft",
      draftPayload: {},
    } as never);
    const res = await POST(new Request("http://x", { method: "POST", body: JSON.stringify({ documentId: "d1" }) }) as never);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json.steps)).toBe(true);
    expect(json.resolutionSnapshot).toBeDefined();
    expect(Array.isArray(json.resolutionSnapshot.missingFields)).toBe(true);
  });

  it("returns graceful fallback when legal summary fails", async () => {
    vi.mocked(requireDocumentAccess).mockResolvedValue({ ok: true, status: 200, userId: "u1", isAdmin: true });
    vi.mocked(prisma.sellerDeclarationDraft.findUnique).mockResolvedValue({
      id: "d1",
      listingId: "l1",
      status: "draft",
      draftPayload: {},
    } as never);
    vi.mocked(getCaseLegalSummary).mockRejectedValueOnce(new Error("graph build failed"));
    const res = await POST(new Request("http://x", { method: "POST", body: JSON.stringify({ documentId: "d1" }) }) as never);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.steps).toEqual([]);
    expect(json.error).toBe(LECIPM_WORKFLOW_EVALUATE_FALLBACK);
    expect(json.resolutionSnapshot).toBeDefined();
  });
});
