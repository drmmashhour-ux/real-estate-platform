import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { LegalAdminQueueCard } from "../LegalAdminQueueCard";
import { LegalAdminRisksTable } from "../LegalAdminRisksTable";

describe("Legal admin components", () => {
  it("LegalAdminQueueCard empty", () => {
    const html = renderToStaticMarkup(createElement(LegalAdminQueueCard, { items: [] }));
    expect(html).toContain("No aggregated items");
  });

  it("LegalAdminRisksTable renders rows", () => {
    const html = renderToStaticMarkup(
      createElement(LegalAdminRisksTable, {
        rows: [{ label: "A", value: 2 }],
      }),
    );
    expect(html).toContain("A");
  });
});
