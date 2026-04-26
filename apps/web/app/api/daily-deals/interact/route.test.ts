import { describe, expect, it, vi } from "vitest";
import { POST } from "./route";

vi.mock("@/lib/auth/session", () => ({ getGuestId: vi.fn() }));
vi.mock("@/lib/analytics/posthog-server", () => ({ captureServerEvent: vi.fn() }));
vi.mock("@/lib/db/legacy", () => ({
  getLegacyDB: () => ({
    feedInteraction: { create: vi.fn() },
  })
}));

import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

describe("POST /api/daily-deals/interact", () => {
  it("requires sign in", async () => {
    vi.mocked(getGuestId).mockResolvedValue(null);
    const res = await POST(new Request("http://x", { method: "POST", body: JSON.stringify({ listingId: "l1", interactionType: "saved" }) }));
    expect(res.status).toBe(401);
  });

  it("stores interaction", async () => {
    vi.mocked(getGuestId).mockResolvedValue("u1");
    vi.mocked(prisma.feedInteraction.create).mockResolvedValue({ id: "f1" } as never);
    const res = await POST(new Request("http://x", { method: "POST", body: JSON.stringify({ listingId: "l1", interactionType: "saved" }) }));
    expect(res.status).toBe(200);
    expect(prisma.feedInteraction.create).toHaveBeenCalled();
  });
});
