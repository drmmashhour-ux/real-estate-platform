import { describe, expect, it } from "vitest";

import { endYmdForSameSpan } from "@/lib/booking/staySpan";

describe("endYmdForSameSpan (Order D.1 – span parity)", () => {
  it("shifts a 3-day span", () => {
    expect(endYmdForSameSpan("2026-06-10", "2026-06-13", "2026-07-01")).toBe("2026-07-04");
  });
  it("handles same-day (1 night) stay", () => {
    expect(endYmdForSameSpan("2026-01-10", "2026-01-10", "2026-02-20")).toBe("2026-02-20");
  });
});
