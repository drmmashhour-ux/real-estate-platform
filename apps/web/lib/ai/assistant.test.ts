import { describe, expect, it } from "vitest";
import { routeAssistantIntent } from "@/lib/ai/assistant-router";
import { mergeFollowUpSearch, parseSearchIntent, nextWeekendRange } from "@/lib/ai/parseSearchIntent";
import { buildPropertySearchHref, buildStaySearchHref } from "@/lib/ai/assistant-actions";
import { compareListings } from "@/lib/ai/assistant-compare";
import { responseForIntent } from "@/lib/ai/assistant-responses";
import { isSpeechRecognitionSupported } from "@/lib/search/voiceSearch";

describe("routeAssistantIntent", () => {
  const baseCtx = { pathname: "/" };

  it("routes property search with extracted entities", () => {
    const r = routeAssistantIntent("2 bedroom condo in Montreal under 650k", baseCtx);
    expect(r.intent).toBe("property_search");
    expect(r.nextAction).toBe("search_navigate");
    expect(r.entities.search?.category).toBe("sale");
    expect(r.entities.search?.property?.city).toBe("Montreal");
    expect(r.entities.search?.property?.maxPrice).toBe(650_000);
  });

  it("routes stay search", () => {
    const r = routeAssistantIntent("short stays in Laval this weekend for 2 guests", baseCtx);
    expect(r.intent).toBe("stay_search");
    expect(r.nextAction).toBe("stay_navigate");
    expect(r.entities.search?.category).toBe("stay");
    expect(r.entities.search?.stayCity ?? r.entities.search?.property?.city).toBe("Laval");
    expect(r.entities.search?.guests).toBe(2);
  });

  it("routes booking help before search keywords", () => {
    const r = routeAssistantIntent("How do I book a BNHub stay?", baseCtx);
    expect(r.intent).toBe("booking_help");
    expect(r.nextAction).toBe("respond_only");
  });

  it("routes unlock help", () => {
    const r = routeAssistantIntent("How does owner contact unlock work?", baseCtx);
    expect(r.intent).toBe("unlock_help");
    expect(r.nextAction).toBe("respond_only");
  });

  it("compare without two ids responds only", () => {
    const r = routeAssistantIntent("Compare these two listings", baseCtx);
    expect(r.intent).toBe("compare_listings");
    expect(r.nextAction).toBe("respond_only");
  });

  it("compare with two ids in context enables compare", () => {
    const r = routeAssistantIntent("What is the difference?", {
      pathname: "/x",
      compareListingIds: ["a", "b"],
    });
    expect(r.intent).toBe("compare_listings");
    expect(r.nextAction).toBe("compare");
  });

  it("listing explainer on listing page", () => {
    const r = routeAssistantIntent("Explain this property", {
      pathname: "/listing/1",
      listingId: "1",
    });
    expect(r.intent).toBe("listing_explainer");
  });
});

describe("parseSearchIntent", () => {
  it("parses Montreal condo sale under 650k", () => {
    const p = parseSearchIntent("2 bedroom condo in Montreal under 650k");
    expect(p.category).toBe("sale");
    expect(p.property?.city).toBe("Montreal");
    expect(p.property?.beds).toBe(2);
    expect(p.property?.maxPrice).toBe(650_000);
    expect(p.property?.propertyTypes).toContain("CONDO");
  });

  it("parses rental with parking under 1800", () => {
    const p = parseSearchIntent("rental with parking under 1800");
    expect(p.category).toBe("rent");
    expect(p.featureSlugs).toContain("parking");
    expect(p.monthlyRentMax).toBe(1800);
  });

  it("sets weekend dates for stay queries", () => {
    const fixed = new Date("2026-04-01T12:00:00.000Z"); // Wednesday
    const p = parseSearchIntent("short stay in Laval this weekend for 2 guests", fixed);
    expect(p.category).toBe("stay");
    const w = nextWeekendRange(fixed);
    expect(p.checkIn).toBe(w.checkIn);
    expect(p.checkOut).toBe(w.checkOut);
  });
});

describe("mergeFollowUpSearch", () => {
  it("updates max price from follow-up", () => {
    const last = { location: "Montreal", priceMax: 650_000 } as const;
    const merged = mergeFollowUpSearch(last as never, "make it under 500k");
    expect(merged?.priceMax).toBe(500_000);
    expect(merged?.location).toBe("Montreal");
  });
});

describe("search href builders", () => {
  it("buildPropertySearchHref includes Montreal and price", () => {
    const parsed = parseSearchIntent("condo in Montreal under 600k");
    const href = buildPropertySearchHref(parsed);
    expect(href.startsWith("/search?")).toBe(true);
    expect(href).toMatch(/Montreal/i);
    expect(href).toMatch(/600/);
  });

  it("buildStaySearchHref targets bnhub stays with city and guests", () => {
    const parsed = parseSearchIntent("short stay in Laval this weekend for 2 guests");
    const href = buildStaySearchHref(parsed);
    expect(href.startsWith("/bnhub/stays?")).toBe(true);
    expect(href).toMatch(/city=Laval/);
    expect(href).toMatch(/guests=2/);
  });
});

describe("compareListings", () => {
  it("notes lower price when both have price labels", () => {
    const text = compareListings(
      { id: "1", title: "A", priceLabel: "$400,000", beds: 2 },
      { id: "2", title: "B", priceLabel: "$500,000", beds: 3 }
    );
    expect(text).toContain("Lower listed price");
    expect(text).toContain("A");
  });

  it("fallback when insufficient comparable data", () => {
    const text = compareListings({ id: "1" }, { id: "2" });
    expect(text.toLowerCase()).toMatch(/need two|open two/i);
  });
});

describe("responseForIntent", () => {
  it("BNHub stay listing explainer does not mention FSBO unlock as primary", () => {
    const text = responseForIntent("listing_explainer", {
      pathname: "/bnhub/x",
      stayId: "s1",
    });
    expect(text.toLowerCase()).toMatch(/date|checkout|stay/);
  });

  it("unsupported intent gives safe fallback suggestion", () => {
    const text = responseForIntent("unsupported", { pathname: "/" });
    expect(text.toLowerCase()).toMatch(/didn|catch|try/);
  });
});

describe("voice unsupported (SSR / node)", () => {
  it("isSpeechRecognitionSupported is false without window", () => {
    expect(isSpeechRecognitionSupported()).toBe(false);
  });
});
