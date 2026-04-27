import { describe, expect, it } from "vitest";

import { EARLY_USER_CAP } from "@/lib/growth/earlyUserConstants";
import {
  earlyUsersJoinedLine,
  getLaunchBannerUrgency,
  launchBannerCtaLabel,
} from "@/lib/growth/launchBannerModel";

describe("getLaunchBannerUrgency", () => {
  it("accent when remaining <= 20 and > 10", () => {
    expect(getLaunchBannerUrgency(21)).toBe("none");
    expect(getLaunchBannerUrgency(20)).toBe("accent");
    expect(getLaunchBannerUrgency(11)).toBe("accent");
  });

  it("critical when remaining <= 10", () => {
    expect(getLaunchBannerUrgency(10)).toBe("critical");
    expect(getLaunchBannerUrgency(0)).toBe("critical");
  });
});

describe("launchBannerCtaLabel", () => {
  it("remaining > 0 → early access CTA and spots copy", () => {
    const v = launchBannerCtaLabel(40);
    expect(v.cta).toBe("Join early access");
    expect(v.message).toContain("40 spots left");
  });

  it("remaining <= 20 → still early access", () => {
    const v = launchBannerCtaLabel(15);
    expect(v.cta).toBe("Join early access");
    expect(v.message).toContain("15 spots left");
  });

  it("remaining = 0 → waitlist", () => {
    const v = launchBannerCtaLabel(0);
    expect(v.cta).toBe("Join waitlist");
    expect(v.message).toContain(`The first ${EARLY_USER_CAP}`);
  });

  it("singular spot", () => {
    const v = launchBannerCtaLabel(1);
    expect(v.message).toContain("1 spot");
  });
});

describe("earlyUsersJoinedLine", () => {
  it("formats count", () => {
    expect(earlyUsersJoinedLine(42)).toBe("42 early users joined");
  });
});
