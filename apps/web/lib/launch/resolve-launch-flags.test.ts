import { describe, expect, it, vi, beforeEach } from "vitest";
import { launchFlags } from "@/config/feature-flags";
import {
  clearLaunchFlagsCache,
  LAUNCH_FLAG_DB_KEYS,
  localeAllowListFromFlags,
  resolveLaunchFlags,
} from "./resolve-launch-flags";

vi.mock("@/lib/db", () => ({
  prisma: {
    featureFlag: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/db/db-error-classification", () => ({
  classifyDbError: vi.fn(() => ({ kind: "unknown", code: null, summary: "mocked" })),
}));

const { prisma } = await import("@/lib/db");

describe("resolve-launch-flags", () => {
  beforeEach(() => {
    clearLaunchFlagsCache();
    vi.mocked(prisma.featureFlag.findMany).mockReset();
  });

  it("keeps DB launch keys aligned with centralized launch flags", () => {
    const flagKeys = Object.keys(launchFlags).sort();
    const dbTargetKeys = Object.values(LAUNCH_FLAG_DB_KEYS).sort();

    expect(dbTargetKeys).toEqual(flagKeys);
  });

  it("merges DB overrides and ignores unknown launch keys", async () => {
    vi.mocked(prisma.featureFlag.findMany).mockResolvedValue([
      { key: "launch:enableArabic", enabled: false },
      { key: "launch:enableFrench", enabled: true },
      { key: "launch:notARealFlag", enabled: true },
    ]);

    const flags = await resolveLaunchFlags();

    expect(flags.enableArabic).toBe(false);
    expect(flags.enableFrench).toBe(true);
    expect(Object.keys(flags)).not.toContain("notARealFlag");
  });

  it("falls back to env defaults when DB flags are unavailable", async () => {
    vi.mocked(prisma.featureFlag.findMany).mockRejectedValue(new Error("db unavailable"));

    await expect(resolveLaunchFlags()).resolves.toEqual(launchFlags);
  });

  it("always keeps English and gates optional locales", () => {
    expect(
      localeAllowListFromFlags({ ...launchFlags, enableFrench: false, enableArabic: false })
    ).toEqual(["en"]);
    expect(
      localeAllowListFromFlags({ ...launchFlags, enableFrench: true, enableArabic: true })
    ).toEqual(["en", "fr", "ar"]);
  });
});
