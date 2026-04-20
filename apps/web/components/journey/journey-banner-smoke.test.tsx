import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { HubBlockersCard } from "./HubBlockersCard";

describe("journey banner smoke", () => {
  it("renders blockers without throwing", () => {
    const html = renderToStaticMarkup(createElement(HubBlockersCard, { blockers: ["Test blocker"] }));
    expect(html).toContain("Blockers");
    expect(html).toContain("Test blocker");
  });

  it("renders nothing when no blockers", () => {
    const html = renderToStaticMarkup(createElement(HubBlockersCard, { blockers: [] }));
    expect(html).toBe("");
  });
});
