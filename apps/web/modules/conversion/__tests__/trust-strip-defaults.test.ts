import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TrustStrip } from "@/components/shared/TrustStrip";

describe("TrustStrip defaults", () => {
  it("renders advisory defaults without fabricated scarcity claims", () => {
    const html = renderToStaticMarkup(createElement(TrustStrip));
    expect(html).toContain("Verified listings where marked");
    expect(html.toLowerCase()).toContain("no fake scarcity");
  });

  it("respects caller lines when provided", () => {
    const html = renderToStaticMarkup(createElement(TrustStrip, { lines: ["Custom line"] }));
    expect(html).toContain("Custom line");
  });
});
