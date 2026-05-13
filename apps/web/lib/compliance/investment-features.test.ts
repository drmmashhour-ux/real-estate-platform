import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  assertInvestmentFeaturesEnabled,
  isInvestmentFeaturesEnabled,
} from "./investment-features";
import { investmentFeaturesOr403 } from "./investment-api-guard";

vi.mock("@/lib/db", () => ({
  prisma: {
    platformFinancialSettings: {
      findUnique: vi.fn(),
    },
  },
}));

const { prisma } = await import("@/lib/db");
const savedEnv = { ...process.env };

describe("investment compliance guard", () => {
  beforeEach(() => {
    delete process.env.INVESTMENT_FEATURES_ENABLED;
    vi.mocked(prisma.platformFinancialSettings.findUnique).mockReset();
  });

  afterEach(() => {
    process.env = { ...savedEnv };
  });

  it("fails closed when env is unset and DB settings are missing", async () => {
    vi.mocked(prisma.platformFinancialSettings.findUnique).mockResolvedValue(null);

    await expect(isInvestmentFeaturesEnabled()).resolves.toBe(false);
  });

  it("fails closed when DB lookup throws", async () => {
    vi.mocked(prisma.platformFinancialSettings.findUnique).mockRejectedValue(
      new Error("db unavailable")
    );

    await expect(isInvestmentFeaturesEnabled()).resolves.toBe(false);
  });

  it("allows only explicit env or DB enablement", async () => {
    vi.mocked(prisma.platformFinancialSettings.findUnique).mockResolvedValue({
      investmentFeaturesEnabled: true,
    });

    await expect(isInvestmentFeaturesEnabled()).resolves.toBe(true);

    process.env.INVESTMENT_FEATURES_ENABLED = "true";
    vi.mocked(prisma.platformFinancialSettings.findUnique).mockResolvedValue({
      investmentFeaturesEnabled: false,
    });

    await expect(isInvestmentFeaturesEnabled()).resolves.toBe(true);
  });

  it("returns a 403 API response when disabled", async () => {
    vi.mocked(prisma.platformFinancialSettings.findUnique).mockResolvedValue(null);

    const response = await investmentFeaturesOr403();
    const body = (await response?.json()) as { code?: string };

    expect(response?.status).toBe(403);
    expect(body.code).toBe("INVESTMENT_DISABLED");
  });

  it("throws a status-coded error when asserted while disabled", async () => {
    vi.mocked(prisma.platformFinancialSettings.findUnique).mockResolvedValue(null);

    await expect(assertInvestmentFeaturesEnabled()).rejects.toMatchObject({ statusCode: 403 });
  });
});
