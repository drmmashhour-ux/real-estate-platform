import { describe, expect, it } from "vitest";

import { compareLeaderboardRows } from "@/modules/broker/performance/broker-leaderboard.service";
import type { BrokerLeaderboardRow } from "@/modules/broker/performance/broker-performance.types";

function row(
  id: string,
  score: number,
  band: BrokerLeaderboardRow["band"],
): BrokerLeaderboardRow {
  return {
    brokerId: id,
    displayName: id,
    overallScore: score,
    band,
    keyStrength: "s",
    keyWeakness: "w",
  };
}

describe("broker-leaderboard ordering", () => {
  it("places insufficient_data after sufficient scores", () => {
    const a = [row("z", 40, "insufficient_data"), row("a", 20, "healthy")];
    a.sort(compareLeaderboardRows);
    expect(a[0].brokerId).toBe("a");
    expect(a[1].band).toBe("insufficient_data");
  });

  it("tie-breaks by brokerId ascending", () => {
    const a = [row("m", 70, "strong"), row("k", 70, "strong")];
    a.sort(compareLeaderboardRows);
    expect(a.map((r) => r.brokerId)).toEqual(["k", "m"]);
  });
});
