import { describe, expect, it, vi } from "vitest";
import { GET } from "./route";

vi.mock("@/lib/auth/session", () => ({ getGuestId: vi.fn() }));
vi.mock("@/src/modules/daily-deal-feed/application/getDailyDealFeed", () => ({ getDailyDealFeed: vi.fn() }));

import { getGuestId } from "@/lib/auth/session";
import { getDailyDealFeed } from "@/src/modules/daily-deal-feed/application/getDailyDealFeed";

describe("GET /api/daily-deals", () => {
  it("requires auth", async () => {
    vi.mocked(getGuestId).mockResolvedValue(null);
    const res = await GET(new Request("http://x/api/daily-deals") as never);
    expect(res.status).toBe(401);
  });

  it("returns feed", async () => {
    vi.mocked(getGuestId).mockResolvedValue("u1");
    vi.mocked(getDailyDealFeed).mockResolvedValue({ generatedForDate: "2026-03-26", feedType: "user", itemCount: 0, hero: null, sections: [], retentionHooks: [] } as never);
    const res = await GET(new Request("http://x/api/daily-deals") as never);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.feed.feedType).toBe("user");
  });
});
