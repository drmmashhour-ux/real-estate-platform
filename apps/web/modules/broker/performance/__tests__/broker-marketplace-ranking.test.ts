import { describe, expect, it } from "vitest";
import { sortMarketplaceRankings } from "@/modules/broker/performance/broker-marketplace-ranking.service";
import type { BrokerMarketplaceRanking } from "@/modules/broker/performance/broker-performance.types";

describe("broker marketplace ranking V1", () => {
  it("sorts by rankScore desc then brokerId asc", () => {
    const rows: BrokerMarketplaceRanking[] = [
      { brokerId: "b", rankScore: 50, band: "good", why: [] },
      { brokerId: "a", rankScore: 60, band: "good", why: [] },
      { brokerId: "c", rankScore: 60, band: "good", why: [] },
    ];
    const s = sortMarketplaceRankings(rows);
    expect(s[0]?.brokerId).toBe("a");
    expect(s[1]?.brokerId).toBe("c");
    expect(s[2]?.brokerId).toBe("b");
  });

  it("does not mutate input", () => {
    const rows: BrokerMarketplaceRanking[] = [{ brokerId: "z", rankScore: 1, band: "low", why: [] }];
    const copy = [...rows];
    sortMarketplaceRankings(rows);
    expect(rows).toEqual(copy);
  });
});
