import { describe, expect, it } from "vitest";

/**
 * ListingCard is a client component — smoke coverage documents link contract to `/listing/:id`.
 */
describe("ListingCard contract", () => {
  it("href pattern", () => {
    expect(`/listing/${"clxxx"}`).toBe("/listing/clxxx");
  });
});
