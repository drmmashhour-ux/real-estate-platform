import { describe, expect, it, vi } from "vitest";
import { GET } from "./route";

vi.mock("@/app/api/legal-graph/_auth", () => ({ requireLegalGraphDocumentAccess: vi.fn() }));
vi.mock("@/src/modules/legal-intelligence-graph/application/buildLegalGraph", () => ({ buildLegalGraph: vi.fn() }));
vi.mock("@/src/modules/legal-intelligence-graph/application/getLegalGraphSummary", () => ({ getLegalGraphSummary: vi.fn() }));
vi.mock("@/src/modules/legal-intelligence-graph/infrastructure/legalGraphRepository", () => ({ getDocumentAndProperty: vi.fn() }));
vi.mock("@/src/modules/legal-intelligence-graph/explanation/legalGraphExplanationService", () => ({ explainLegalGraphSummary: vi.fn().mockReturnValue({ summary: "x" }) }));

import { requireLegalGraphDocumentAccess } from "@/app/api/legal-graph/_auth";
import { buildLegalGraph } from "@/src/modules/legal-intelligence-graph/application/buildLegalGraph";
import { getLegalGraphSummary } from "@/src/modules/legal-intelligence-graph/application/getLegalGraphSummary";
import { getDocumentAndProperty } from "@/src/modules/legal-intelligence-graph/infrastructure/legalGraphRepository";

describe("GET /api/legal-graph/[documentId]", () => {
  it("requires auth/access", async () => {
    vi.mocked(requireLegalGraphDocumentAccess).mockResolvedValue({ ok: false, status: 403 } as never);
    const res = await GET(new Request("http://x") as never, { params: Promise.resolve({ documentId: "d1" }) } as never);
    expect(res.status).toBe(403);
  });

  it("returns sanitized summary", async () => {
    vi.mocked(requireLegalGraphDocumentAccess).mockResolvedValue({ ok: true, status: 200, userId: "u1" } as never);
    vi.mocked(buildLegalGraph).mockResolvedValue({ propertyId: "p1", documentId: "d1", issueCount: 1 } as never);
    vi.mocked(getLegalGraphSummary).mockResolvedValue({ fileHealth: "warning", blockingIssues: [], warnings: [], missingDependencies: [], unresolvedReviewIssues: [], criticalOpenCount: 0, signatureReadiness: { ready: true, reasons: [] }, nextActions: [] } as never);
    vi.mocked(getDocumentAndProperty).mockResolvedValue({ status: "draft" } as never);
    const res = await GET(new Request("http://x") as never, { params: Promise.resolve({ documentId: "d1" }) } as never);
    expect(res.status).toBe(200);
  });
});
