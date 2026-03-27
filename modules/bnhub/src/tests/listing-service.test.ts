import { describe, it, expect } from "vitest";
import { bnhubListingServiceStub } from "../services/listing-service.js";

describe("BNHub ListingService", () => {
  it("getById returns null when not implemented", async () => {
    const result = await bnhubListingServiceStub.getById("any-id");
    expect(result).toBeNull();
  });

  it("listByHost returns empty array when not implemented", async () => {
    const result = await bnhubListingServiceStub.listByHost("host-1");
    expect(result).toEqual([]);
  });
});
