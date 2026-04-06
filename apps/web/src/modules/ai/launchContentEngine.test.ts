import { describe, expect, it } from "vitest";
import { generateAdCopy, generateBlogPost, generateListingDescription } from "./launchContentEngine";

describe("launchContentEngine", () => {
  it("generateListingDescription returns non-empty copy", async () => {
    const t = await generateListingDescription({ city: "Montreal", listingTitle: "Condo" });
    expect(t.length).toBeGreaterThan(20);
    expect(t).toMatch(/Montreal/i);
  });

  it("generateBlogPost returns SEO shape", async () => {
    const p = await generateBlogPost({ city: "Laval", topic: "invest" });
    expect(p.title).toBeTruthy();
    expect(p.bodyHtml).toContain("<");
  });

  it("generateAdCopy returns a line", async () => {
    const a = await generateAdCopy("Spring campaign");
    expect(a.length).toBeGreaterThan(10);
  });
});
