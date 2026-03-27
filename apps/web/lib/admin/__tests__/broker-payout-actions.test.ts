import { describe, expect, it } from "vitest";
import { nextPayoutStatus } from "../broker-payout-actions";

describe("nextPayoutStatus", () => {
  it("allows approve from PENDING", () => {
    expect(nextPayoutStatus("PENDING", "approve")).toBe("APPROVED");
  });
  it("allows mark_paid from APPROVED", () => {
    expect(nextPayoutStatus("APPROVED", "mark_paid")).toBe("PAID");
  });
  it("blocks mark_paid from PENDING", () => {
    expect(nextPayoutStatus("PENDING", "mark_paid")).toBeNull();
  });
  it("allows cancel from APPROVED", () => {
    expect(nextPayoutStatus("APPROVED", "cancel")).toBe("CANCELLED");
  });
});
