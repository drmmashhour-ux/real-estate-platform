import { describe, expect, it, vi } from "vitest";
import { POST } from "./route";

vi.mock("@/lib/auth/session", () => ({ getGuestId: vi.fn() }));
vi.mock("@/lib/auth/is-platform-admin", () => ({ isPlatformAdmin: vi.fn() }));
vi.mock("@/src/modules/knowledge/ingestion/uploadKnowledgeDocument", () => ({ uploadKnowledgeDocument: vi.fn() }));

import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";

describe("POST /api/knowledge/upload", () => {
  it("requires admin", async () => {
    vi.mocked(getGuestId).mockResolvedValue("u1");
    vi.mocked(isPlatformAdmin).mockResolvedValue(false as never);
    const res = await POST(new Request("http://x", { method: "POST", body: JSON.stringify({}) }) as never);
    expect(res.status).toBe(403);
  });
});
