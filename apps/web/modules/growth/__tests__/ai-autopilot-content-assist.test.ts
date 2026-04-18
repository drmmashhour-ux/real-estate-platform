import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetContentAssistMonitoringForTests } from "../ai-autopilot-content-monitoring.service";

const contentFlags = vi.hoisted(() => ({
  contentAssistV1: true,
  adCopyV1: true,
  listingCopyV1: true,
  outreachCopyV1: true,
}));

vi.mock("@/config/feature-flags", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/config/feature-flags")>();
  return {
    ...mod,
    aiAutopilotContentAssistFlags: contentFlags,
  };
});

import { buildContentHub } from "../ai-autopilot-content-hub.service";
import {
  generateAdCopyDrafts,
  generateContentDrafts,
  generateListingCopyDrafts,
  generateOutreachDrafts,
} from "../ai-autopilot-content-assist.service";

const FORBIDDEN = /\b(guarantee|guaranteed)\b/i;

beforeEach(() => {
  contentFlags.contentAssistV1 = true;
  contentFlags.adCopyV1 = true;
  contentFlags.listingCopyV1 = true;
  contentFlags.outreachCopyV1 = true;
  resetContentAssistMonitoringForTests();
});

describe("generateAdCopyDrafts", () => {
  it("returns three variants with rationale", () => {
    const drafts = generateAdCopyDrafts({ leadSegment: "seller" }, { now: "2026-04-01T00:00:00.000Z" });
    expect(drafts).toHaveLength(3);
    expect(drafts.every((d) => d.rationale.length > 0)).toBe(true);
    expect(drafts.every((d) => !FORBIDDEN.test(d.body))).toBe(true);
  });
});

describe("generateListingCopyDrafts", () => {
  it("returns title + description style drafts", () => {
    const drafts = generateListingCopyDrafts(
      {
        title: "Modern Condo",
        description: "Spacious layout near transit.",
        city: "Montréal",
        propertyType: "condo",
        highlights: ["Parking", "Gym"],
      },
      { now: "2026-04-01T00:00:00.000Z" },
    );
    expect(drafts.length).toBeGreaterThanOrEqual(3);
    expect(drafts.some((d) => d.title?.includes("Condo"))).toBe(true);
  });

  it("does not mutate listing input", () => {
    const listing = Object.freeze({
      title: "T",
      description: "D",
      city: "C",
      propertyType: "house",
      highlights: [] as string[],
    });
    generateListingCopyDrafts(listing);
    expect(listing.title).toBe("T");
  });
});

describe("generateOutreachDrafts", () => {
  it("returns three outreach variants", () => {
    const drafts = generateOutreachDrafts({ city: "Calgary", leadSegment: "seller" }, { now: "2026-04-01T00:00:00.000Z" });
    expect(drafts).toHaveLength(3);
    expect(drafts.every((d) => d.type === "outreach_copy")).toBe(true);
    expect(drafts.every((d) => !FORBIDDEN.test(d.body))).toBe(true);
  });
});

describe("generateContentDrafts", () => {
  it("aggregates when master flag on", () => {
    const all = generateContentDrafts({
      leadSegment: "seller",
      listing: { city: "Ottawa", propertyType: "townhouse", title: "Bright TH" },
    });
    expect(all.length).toBeGreaterThan(5);
  });

  it("returns empty when content assist off", () => {
    contentFlags.contentAssistV1 = false;
    expect(generateContentDrafts({ leadSegment: "seller" })).toEqual([]);
  });
});

describe("buildContentHub", () => {
  it("splits drafts by channel", () => {
    const hub = buildContentHub({ leadSegment: "investor" }, { now: "2026-04-01T00:00:00.000Z" });
    expect(hub.adCopy.length).toBeGreaterThan(0);
    expect(hub.outreachCopy.length).toBeGreaterThan(0);
    expect(hub.listingCopy.length).toBeGreaterThan(0);
  });
});

describe("safety", () => {
  it("content assist service has no ads API or publish imports", () => {
    const dir = dirname(fileURLToPath(import.meta.url));
    const src = readFileSync(join(dir, "../ai-autopilot-content-assist.service.ts"), "utf8");
    expect(/facebook|meta\.com|googleads|tiktok|publish\(/i.test(src)).toBe(false);
  });
});
