import { describe, expect, it, vi } from "vitest";
import { POST } from "./route";

vi.mock("@/lib/auth/session", () => ({ getGuestId: vi.fn() }));
vi.mock("@/src/modules/ai-legal-assistant/application/executeLegalAssistantAction", () => ({ executeLegalAssistantAction: vi.fn() }));

import { getGuestId } from "@/lib/auth/session";

describe("POST /api/legal-assistant/action", () => {
  it("requires auth", async () => {
    vi.mocked(getGuestId).mockResolvedValue(null);
    const res = await POST(new Request("http://x", { method: "POST", body: JSON.stringify({ documentId: "d1", action: "draft_internal_comment" }) }) as never);
    expect(res.status).toBe(401);
  });
});
