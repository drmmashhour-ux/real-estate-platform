import { describe, expect, it, vi } from "vitest";
import { POST } from "./route";

vi.mock("@/app/api/legal-workflow/_auth", () => ({ requireDocumentAccess: vi.fn() }));
vi.mock("@/src/modules/legal-workflow/infrastructure/legalWorkflowRepository", () => ({ createAuditLog: vi.fn(), listAuditLogs: vi.fn() }));

import { requireDocumentAccess } from "@/app/api/legal-workflow/_auth";
import { createAuditLog } from "@/src/modules/legal-workflow/infrastructure/legalWorkflowRepository";

describe("POST /api/legal-workflow/[documentId]/comments", () => {
  it("requires access", async () => {
    vi.mocked(requireDocumentAccess).mockResolvedValue({ ok: false, status: 403 } as never);
    const res = await POST(new Request("http://x", { method: "POST", body: JSON.stringify({ text: "x" }) }) as never, { params: Promise.resolve({ documentId: "d1" }) } as never);
    expect(res.status).toBe(403);
  });

  it("stores comment audit", async () => {
    vi.mocked(requireDocumentAccess).mockResolvedValue({ ok: true, status: 200, userId: "u1", isAdmin: true } as never);
    vi.mocked(createAuditLog).mockResolvedValue({ id: "a1" } as never);
    const res = await POST(new Request("http://x", { method: "POST", body: JSON.stringify({ text: "Hello", sectionKey: "known_defects" }) }) as never, { params: Promise.resolve({ documentId: "d1" }) } as never);
    expect(res.status).toBe(200);
  });
});
