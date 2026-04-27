import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  CACHE_KEYS,
  clearCache,
  getCached,
  getCacheStats,
} from "../cache";

describe("getCached", () => {
  beforeEach(() => {
    clearCache();
  });

  afterEach(() => {
    clearCache();
    vi.useRealTimers();
  });

  it("returns cached value on second call without re-running loader", async () => {
    const loader = vi.fn().mockResolvedValue({ n: 1 });
    const a = await getCached("t1", 60, loader);
    const b = await getCached("t1", 60, loader);
    expect(a).toEqual({ n: 1 });
    expect(b).toEqual({ n: 1 });
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("refreshes after TTL", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    const loader = vi.fn().mockResolvedValue(1);
    await getCached("t2", 10, loader);
    await getCached("t2", 10, loader);
    expect(loader).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(10_001);
    await getCached("t2", 10, loader);
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it("returns stale value and logs when loader fails after a prior success", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-01T00:00:00.000Z"));
    const loader = vi.fn().mockResolvedValueOnce("ok").mockRejectedValueOnce(new Error("down"));
    expect(await getCached("stale-key", 5, () => loader())).toBe("ok");
    vi.advanceTimersByTime(6_000);
    expect(await getCached("stale-key", 5, () => loader())).toBe("ok");
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("rethrows when loader fails and there is no usable prior value", async () => {
    const loader = vi.fn().mockRejectedValue(new Error("first fail"));
    await expect(getCached("missing", 10, () => loader())).rejects.toThrow("first fail");
  });
});

describe("clearCache & getCacheStats", () => {
  beforeEach(() => clearCache());

  it("clears one key or all keys", async () => {
    await getCached("a", 60, async () => 1);
    await getCached("b", 60, async () => 2);
    expect(getCacheStats().size).toBe(2);
    clearCache("a");
    expect(getCacheStats().size).toBe(1);
    clearCache();
    expect(getCacheStats().size).toBe(0);
  });
});

describe("CACHE_KEYS (no user-scoped or payment keys)", () => {
  it("uses only aggregate / listing-range public keys", () => {
    expect(CACHE_KEYS.demandHeatmap).toBe("demand:heatmap");
    expect(CACHE_KEYS.earlyUsersCount).toBe("early-users:count");
    expect(CACHE_KEYS.investorMetrics).toBe("investor-metrics");
    expect(CACHE_KEYS.launchReadiness).toBe("launch-readiness");
    expect(CACHE_KEYS.trustSignals("paris")).toBe("trust-signals:paris");
    expect(CACHE_KEYS.availability("L1", "2026-01-01", "2026-01-07")).toBe(
      "availability:L1:2026-01-01:2026-01-07"
    );
  });
});
