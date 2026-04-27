import { describe, it, expect, vi, beforeEach } from "vitest";

import { GET } from "./route";

const loadFeed = vi.fn();
vi.mock("@/lib/feed/loadFeedListingsPage", () => ({
  FEED_WINDOW: 50,
  loadFeedListingsFromDb: (...a: unknown[]) => loadFeed(...a),
}));

vi.mock("@/lib/ai/userProfile", () => ({
  getUserProfile: vi.fn().mockResolvedValue({
    preferredCities: [],
    avgPriceRange: { min: 0, max: 0 },
    viewedListings: [],
    behaviorType: "new" as const,
  }),
}));

vi.mock("@/lib/flags", () => ({
  flags: { RECOMMENDATIONS: true, AI_PRICING: false, AUTONOMOUS_AGENT: false },
}));

vi.mock("@/lib/security/rateLimit", () => ({
  getClientIp: () => "127.0.0.1",
  rateLimit: () => true,
}));

vi.mock("@/lib/monitoring/errorLogger", () => ({
  logError: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  getGuestId: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/ai/conversionEngine", () => ({
  getConversionIntentByListingId: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/lib/ai/reputationEngine", () => ({
  getHostReputationsForHostIds: vi.fn().mockResolvedValue(new Map([["host-x", { hostUserId: "host-x", score: 0.5, level: "medium" as const, signals: [] }]])),
}));

import { getUserProfile } from "@/lib/ai/userProfile";

const sampleRow = {
  id: "lst-1",
  title: "Cozy",
  city: "Montréal",
  price: 99,
  createdAt: new Date("2026-02-01T10:00:00Z"),
  demandScore: 5,
  imageUrl: "https://example.com/a.jpg" as string | null,
  socialProofScore: 0,
  socialProofStrength: "low" as const,
  listingReputationScore: 0,
  reputationLevel: "low" as const,
  ownerId: "host-x",
};

describe("GET /api/feed/listings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns listings and null nextCursor when window not full", async () => {
    loadFeed.mockResolvedValue({ rows: [sampleRow], hasMore: false });
    const res = await GET(new Request("http://localhost/api/feed/listings"));
    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      listings: { id: string }[];
      nextCursor: string | null;
      ranked: boolean;
    };
    expect(data.listings).toHaveLength(1);
    expect(data.listings[0]!.id).toBe("lst-1");
    expect(data.nextCursor).toBeNull();
    expect(data.ranked).toBe(true);
  });

  it("returns nextCursor when more pages exist", async () => {
    loadFeed.mockResolvedValue({ rows: Array(50).fill(sampleRow), hasMore: true });
    const res = await GET(new Request("http://localhost/api/feed/listings?limit=10"));
    expect(res.status).toBe(200);
    const data = (await res.json()) as { nextCursor: string | null };
    expect(data.nextCursor).toBeTruthy();
  });

  it("feeds getUserProfile for ranking", async () => {
    loadFeed.mockResolvedValue({ rows: [sampleRow], hasMore: false });
    await GET(new Request("http://localhost/api/feed/listings"));
    expect(vi.mocked(getUserProfile)).toHaveBeenCalled();
  });
});
