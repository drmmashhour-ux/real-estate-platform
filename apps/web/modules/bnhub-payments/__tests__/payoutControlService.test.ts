import { describe, it, expect } from "vitest";
import { computeHostNetPayout } from "@/modules/bnhub-payments/services/payoutControlService";

describe("computeHostNetPayout", () => {
  it("subtracts platform fee from guest paid", () => {
    expect(computeHostNetPayout({ guestPaidCents: 10000, platformFeeCents: 1500 }).netToHostCents).toBe(8500);
  });

  it("never returns negative", () => {
    expect(computeHostNetPayout({ guestPaidCents: 100, platformFeeCents: 500 }).netToHostCents).toBe(0);
  });
});
