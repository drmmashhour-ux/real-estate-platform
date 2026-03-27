import { describe, expect, it } from "vitest";
import { buildVerificationQueueWhere } from "@/lib/trustgraph/application/loadVerificationQueue";

describe("buildVerificationQueueWhere", () => {
  it("returns empty object when no filters", () => {
    const w = buildVerificationQueueWhere({
      page: 1,
      pageSize: 30,
    });
    expect(w).toEqual({});
  });

  it("adds search OR for entity id and uuid", () => {
    const w = buildVerificationQueueWhere({
      page: 1,
      pageSize: 30,
      search: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(w).toHaveProperty("AND");
  });
});
