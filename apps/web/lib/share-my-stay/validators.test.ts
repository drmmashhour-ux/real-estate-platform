import { describe, expect, it } from "vitest";
import { isValidRecipientEmail, parseExtendBody, parseShareTypeInput } from "./validators";

describe("share-my-stay validators", () => {
  it("parseShareTypeInput accepts API aliases", () => {
    expect(parseShareTypeInput("live_location")?.toString()).toMatch(/LIVE/);
    expect(parseShareTypeInput("stay_status_only")?.toString()).toMatch(/STAY_STATUS/);
    expect(parseShareTypeInput("invalid")).toBeNull();
  });

  it("isValidRecipientEmail rejects bad addresses", () => {
    expect(isValidRecipientEmail("a@b.co")).toBe(true);
    expect(isValidRecipientEmail("not-an-email")).toBe(false);
  });

  it("parseExtendBody handles presets and addMinutes", () => {
    expect(parseExtendBody({ preset: "1h" })).toEqual({ kind: "add_minutes", minutes: 60 });
    expect(parseExtendBody({ preset: "until_checkout" })).toEqual({ kind: "until_checkout" });
    expect(parseExtendBody({ addMinutes: 45 })).toEqual({ kind: "add_minutes", minutes: 45 });
    expect(parseExtendBody({ addMinutes: 3 })).toBeNull();
  });
});
