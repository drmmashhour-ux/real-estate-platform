import { describe, expect, it, vi } from "vitest";
import { POST } from "./route";

vi.mock("@/lib/auth/session", () => ({ getGuestId: vi.fn() }));
vi.mock("@/src/modules/ai-legal-assistant/application/runLegalAssistant", () => ({ runLegalAssistant: vi.fn() }));

import { getGuestId } from "@/lib/auth/session";

describe("POST /api/legal-assistant/chat", () => {
  it("requires auth", async () => {
    vi.mocked(getGuestId).mockResolvedValue(null);
    const res = await POST(new Request("http://x", { method: "POST", body: JSON.stringify({ documentId: "d1", message: "hi" }) }) as never);
    expect(res.status).toBe(401);
  });
});
