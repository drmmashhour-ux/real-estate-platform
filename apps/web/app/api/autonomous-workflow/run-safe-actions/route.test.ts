import { describe, expect, it, vi } from "vitest";
import { POST } from "./route";

vi.mock("@/app/api/legal-workflow/_auth", () => ({
  requireDocumentAccess: vi.fn(),
}));

import { requireDocumentAccess } from "@/app/api/legal-workflow/_auth";

describe("POST /api/autonomous-workflow/run-safe-actions", () => {
  it("returns 403 when access denied", async () => {
    vi.mocked(requireDocumentAccess).mockResolvedValue({ ok: false, status: 403 } as any);

    const res = await POST(new Request("http://x", { method: "POST", body: JSON.stringify({ documentId: "d1" }) })) as any;
    expect(res.status).toBe(403);
  });
});
