import { describe, it, expect } from "vitest";
import { generateBnhubDailyContentPack } from "@/lib/bnhub/revenue-content";

describe("generateBnhubDailyContentPack", () => {
  it("is deterministic per calendar day", () => {
    const d = new Date("2026-03-15T12:00:00.000Z");
    const a = generateBnhubDailyContentPack(d);
    const b = generateBnhubDailyContentPack(new Date("2026-03-15T08:00:00.000Z"));
    expect(a.date).toBe("2026-03-15");
    expect(b.posts).toEqual(a.posts);
    expect(a.posts).toHaveLength(3);
    expect(a.posts[0]?.hashtags).toHaveLength(3);
  });

  it("changes when the date changes", () => {
    const a = generateBnhubDailyContentPack(new Date("2026-03-15T12:00:00.000Z"));
    const c = generateBnhubDailyContentPack(new Date("2026-03-16T12:00:00.000Z"));
    expect(c.date).toBe("2026-03-16");
    expect(c.posts[0]?.hashtags).not.toEqual(a.posts[0]?.hashtags);
  });
});
