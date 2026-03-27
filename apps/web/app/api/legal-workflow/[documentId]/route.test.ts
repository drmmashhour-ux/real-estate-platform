import { describe, expect, it, vi } from "vitest";
import { GET } from "./route";

vi.mock("@/app/api/legal-workflow/_auth", () => ({ requireDocumentAccess: vi.fn() }));
vi.mock("@/src/modules/legal-workflow/application/getDocumentWorkflow", () => ({ getDocumentWorkflow: vi.fn() }));

import { requireDocumentAccess } from "@/app/api/legal-workflow/_auth";
import { getDocumentWorkflow } from "@/src/modules/legal-workflow/application/getDocumentWorkflow";

describe("GET /api/legal-workflow/[documentId]", () => {
  it("enforces auth/role protection", async () => {
    vi.mocked(requireDocumentAccess).mockResolvedValue({ ok: false, status: 403 } as never);
    const res = await GET(new Request("http://x") as never, { params: Promise.resolve({ documentId: "d1" }) } as never);
    expect(res.status).toBe(403);
  });

  it("returns workflow when allowed", async () => {
    vi.mocked(requireDocumentAccess).mockResolvedValue({ ok: true, status: 200, userId: "u1", isAdmin: true } as never);
    vi.mocked(getDocumentWorkflow).mockResolvedValue({ document: { id: "d1", status: "draft" }, versions: [], audit: [] } as never);
    const res = await GET(new Request("http://x") as never, { params: Promise.resolve({ documentId: "d1" }) } as never);
    expect(res.status).toBe(200);
  });
});
