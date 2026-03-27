import { describe, expect, it, vi } from "vitest";
import { GET } from "./route";

vi.mock("@/lib/auth/session", () => ({ getGuestId: vi.fn() }));
vi.mock("@/src/modules/ai-legal-assistant/application/buildLegalAssistantContext", () => ({ buildLegalAssistantContext: vi.fn() }));

import { getGuestId } from "@/lib/auth/session";

describe("GET /api/legal-assistant/context/[documentId]", () => {
  it("requires auth", async () => {
    vi.mocked(getGuestId).mockResolvedValue(null);
    const res = await GET(new Request("http://x") as never, { params: Promise.resolve({ documentId: "d1" }) } as never);
    expect(res.status).toBe(401);
  });
});
