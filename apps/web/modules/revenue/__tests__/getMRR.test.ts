import { describe, expect, it, vi } from "vitest";
import { SubscriptionStatus } from "@prisma/client";
import { getMRR } from "../application/getMRR";

describe("getMRR", () => {
  it("sums mrrCents for paying subscriptions", async () => {
    const db = {
      subscription: {
        findMany: vi.fn().mockResolvedValue([
          { mrrCents: 1000 },
          { mrrCents: 4900 },
          { mrrCents: null },
        ]),
      },
    };
    const r = await getMRR(db as never);
    expect(r.mrr).toBe(59);
    expect(r.activeSubscriptionCount).toBe(3);
    expect(r.subscriptionsMissingMrrCount).toBe(1);
  });

  it("returns null mrr when no subscriptions", async () => {
    const db = {
      subscription: { findMany: vi.fn().mockResolvedValue([]) },
    };
    const r = await getMRR(db as never);
    expect(r.mrr).toBeNull();
    expect(r.activeSubscriptionCount).toBe(0);
  });

  it("returns null when all rows missing mrr", async () => {
    const db = {
      subscription: {
        findMany: vi.fn().mockResolvedValue([{ mrrCents: null }, { mrrCents: null }]),
      },
    };
    const r = await getMRR(db as never);
    expect(r.mrr).toBeNull();
    expect(r.subscriptionsMissingMrrCount).toBe(2);
  });
});
