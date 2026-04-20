import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { LegalHubHero } from "../LegalHubHero";
import { LegalDisclaimerCard } from "../LegalDisclaimerCard";
import { LegalWorkflowCard } from "../LegalWorkflowCard";

describe("Legal Hub components", () => {
  it("LegalHubHero renders", () => {
    const html = renderToStaticMarkup(
      createElement(LegalHubHero, {
        hero: {
          title: "Test",
          subtitle: "Sub",
          actorLabel: "Buyer",
          portfolioLine: "0/1 complete",
        },
      }),
    );
    expect(html).toContain("Test");
  });

  it("LegalDisclaimerCard renders list", () => {
    const html = renderToStaticMarkup(
      createElement(LegalDisclaimerCard, {
        paragraphs: ["Line a", "Line b"],
      }),
    );
    expect(html).toContain("Line a");
  });

  it("LegalWorkflowCard renders progress", () => {
    const html = renderToStaticMarkup(
      createElement(LegalWorkflowCard, {
        card: {
          workflowType: "privacy_consent",
          title: "Privacy",
          shortDescription: "desc",
          completionPercent: 40,
          pendingLabel: "privacy_policy",
          nextAction: "Acknowledge policy",
          reviewBadge: false,
        },
      }),
    );
    expect(html).toContain("40%");
  });
});
