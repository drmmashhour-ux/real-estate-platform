import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    fsboListing: { findUnique: vi.fn() },
    dealAnalysis: { findFirst: vi.fn() },
  },
}));

vi.mock("@/src/modules/watchlist-alerts/infrastructure/watchlistSnapshotRepository", () => ({
  getLatestWatchlistSnapshotRow: vi.fn(),
  createWatchlistSnapshotRow: vi.fn(),
  toSnapshotState: vi.fn((x) => x),
}));

import { prisma } from "@/lib/db";
import {
  createWatchlistSnapshotRow,
  getLatestWatchlistSnapshotRow,
} from "@/src/modules/watchlist-alerts/infrastructure/watchlistSnapshotRepository";
import { captureWatchlistSnapshot } from "@/src/modules/watchlist-alerts/application/captureWatchlistSnapshot";

describe("captureWatchlistSnapshot", () => {
  beforeEach(() => vi.clearAllMocks());

  it("snapshot created successfully", async () => {
    vi.mocked(prisma.fsboListing.findUnique).mockResolvedValue({ trustScore: 70, riskScore: 20, priceCents: 500000, status: "ACTIVE" } as never);
    vi.mocked(prisma.dealAnalysis.findFirst).mockResolvedValue({ investmentScore: 75, confidenceScore: 66, recommendation: "good" } as never);
    vi.mocked(getLatestWatchlistSnapshotRow).mockResolvedValue(null as never);
    vi.mocked(createWatchlistSnapshotRow).mockResolvedValue({ id: "s2", userId: "u1", listingId: "l1", dealScore: 75, trustScore: 70, fraudScore: 20, confidence: 66, recommendation: "good", price: 500000, listingStatus: "ACTIVE", createdAt: new Date() } as never);

    const out = await captureWatchlistSnapshot("u1", "l1");
    expect(out.snapshot.id).toBe("s2");
    expect(createWatchlistSnapshotRow).toHaveBeenCalled();
    expect(createWatchlistSnapshotRow).toHaveBeenCalledTimes(1);
  });

  it("null-safe snapshot creation", async () => {
    vi.mocked(prisma.fsboListing.findUnique).mockResolvedValue(null as never);
    vi.mocked(prisma.dealAnalysis.findFirst).mockResolvedValue(null as never);
    vi.mocked(getLatestWatchlistSnapshotRow).mockResolvedValue(null as never);
    vi.mocked(createWatchlistSnapshotRow).mockResolvedValue({ id: "s3", userId: "u1", listingId: "l2", dealScore: null, trustScore: null, fraudScore: null, confidence: null, recommendation: null, price: null, listingStatus: null, createdAt: new Date() } as never);

    const out = await captureWatchlistSnapshot("u1", "l2");
    expect(out.snapshot.dealScore).toBeNull();
    expect(out.snapshot.price).toBeNull();
  });
});
