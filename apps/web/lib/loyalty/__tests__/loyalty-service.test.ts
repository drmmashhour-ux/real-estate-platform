import { describe, it, expect, vi } from "vitest";
import { applyLoyaltyCreditForPaidBooking } from "../loyalty-service";

describe("applyLoyaltyCreditForPaidBooking", () => {
  it("treats unique bookingId constraint as idempotent skip", async () => {
    const prisma = {
      $transaction: vi.fn().mockRejectedValue(new Error("Unique constraint failed on the fields: (`booking_id`)")),
    };
    const r = await applyLoyaltyCreditForPaidBooking(prisma as never, {
      bookingId: "b1",
      guestUserId: "u1",
    });
    expect(r).toEqual({ ok: true, skipped: true });
  });
});
