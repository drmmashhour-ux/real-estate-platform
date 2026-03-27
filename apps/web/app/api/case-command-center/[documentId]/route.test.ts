import { describe, expect, it, vi } from "vitest";
import { GET } from "./route";

vi.mock("@/lib/auth/session", () => ({ getGuestId: vi.fn() }));
vi.mock("@/src/modules/ai-legal-assistant/tools/_access", () => ({ assertDocumentAccess: vi.fn() }));
vi.mock("@/src/modules/case-command-center/application/getCaseOverview", () => ({ getCaseOverview: vi.fn() }));

import { getGuestId } from "@/lib/auth/session";
import { assertDocumentAccess } from "@/src/modules/ai-legal-assistant/tools/_access";

describe("GET /api/case-command-center/[documentId]", () => {
  it("requires access", async () => {
    vi.mocked(getGuestId).mockResolvedValue("u1");
    vi.mocked(assertDocumentAccess).mockResolvedValue(false as never);
    const res = await GET(new Request("http://x") as never, { params: Promise.resolve({ documentId: "d1" }) } as never);
    expect(res.status).toBe(403);
  });
});
