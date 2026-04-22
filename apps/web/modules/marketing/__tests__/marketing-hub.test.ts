import { describe, expect, it } from "vitest";

import { MARKETING_MAX_POSTS_PER_DAY } from "../marketing-scheduler.service";

describe("marketing hub safety defaults", () => {
  it("caps automated volume per day", () => {
    expect(MARKETING_MAX_POSTS_PER_DAY).toBe(3);
  });
});
