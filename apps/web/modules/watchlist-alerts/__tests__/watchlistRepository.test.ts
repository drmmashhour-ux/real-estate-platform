import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    watchlist: { findFirst: vi.fn(), create: vi.fn() },
    watchlistItem: { findUnique: vi.fn(), create: vi.fn(), deleteMany: vi.fn() },
  },
}));

import { prisma } from "@/lib/db";
import { addListingToWatchlist, removeListingFromWatchlist } from "@/src/modules/watchlist-alerts/infrastructure/watchlistRepository";

describe("watchlist repository", () => {
  it("prevents duplicates", async () => {
    vi.mocked(prisma.watchlist.findFirst).mockResolvedValue({ id: "w1", userId: "u1", name: "x" } as never);
    vi.mocked(prisma.watchlistItem.findUnique).mockResolvedValue({ id: "i1" } as never);
    const out = await addListingToWatchlist({ userId: "u1", listingId: "l1" });
    expect(out.created).toBe(false);
  });

  it("remove flow", async () => {
    vi.mocked(prisma.watchlist.findFirst).mockResolvedValue({ id: "w1", userId: "u1", name: "x" } as never);
    vi.mocked(prisma.watchlistItem.deleteMany).mockResolvedValue({ count: 1 } as never);
    const out = await removeListingFromWatchlist({ userId: "u1", listingId: "l1" });
    expect(out.removedCount).toBe(1);
  });
});
