import { describe, expect, it } from "vitest";

import { bnhubBookingFeeSplitCents } from "@/lib/stripe/bnhub-connect";
import { hubBucketForPaymentType } from "@/modules/dashboard/services/revenue-dashboard.service";
import {
  brokerLeadPrice,
  bnhubCommissionRate,
  listingFee,
  premiumListingFee,
  brokerSuccessBonus,
} from "@/modules/pricing/pricing.config";

describe("BNHub commission split", () => {
  it("splits gross into platform fee and host payout", () => {
    const split = bnhubBookingFeeSplitCents(100_000);
    expect(split.totalAmountCents).toBe(100_000);
    expect(split.platformFeeCents + split.hostPayoutCents).toBe(100_000);
    expect(split.platformFeeCents).toBeGreaterThan(0);
  });
});

describe("hubBucketForPaymentType", () => {
  it("maps hubs for revenue aggregation", () => {
    expect(hubBucketForPaymentType("booking").hubKey).toBe("bnhub");
    expect(hubBucketForPaymentType("featured_listing").hubKey).toBe("listings");
    expect(hubBucketForPaymentType("lead_unlock").hubKey).toBe("broker");
    expect(hubBucketForPaymentType("soins_residence").hubKey).toBe("residence");
  });
});

describe("pricing.config Part 1 exports", () => {
  it("exports typed anchors", () => {
    expect(typeof listingFee).toBe("number");
    expect(typeof premiumListingFee).toBe("number");
    expect(typeof brokerLeadPrice).toBe("number");
    expect(typeof brokerSuccessBonus).toBe("number");
    expect(bnhubCommissionRate).toBeGreaterThan(0);
    expect(bnhubCommissionRate).toBeLessThan(1);
  });
});
