import { describe, expect, it, beforeEach } from "vitest";

import {
  getCountryConfig,
  listAllCountryConfigsForExpansion,
  buildGlobalDashboardSnapshot,
  buildCountryDetailView,
  resetGlobalExpansionStateForTests,
} from "../global-country.service";
import { getRegulationViewFromConfig } from "../global-regulation.service";
import { tUi, defaultLocaleForCountry, supportedLocalesForCountry } from "../global-localization.service";
import { formatCurrencyDisplay, normalizeToCadCents } from "../global-currency.service";
import { launchCountry } from "../global-launch.service";

describe("global-expansion", () => {
  beforeEach(() => {
    resetGlobalExpansionStateForTests();
  });

  it("loads country config for CA and planning markets", () => {
    const ca = getCountryConfig("ca");
    expect(ca?.countryCode).toBe("CA");
    const fr = getCountryConfig("fr");
    expect(fr?.countryCode).toBe("FR");
  });

  it("lists all expansion countries including planning-only", () => {
    const all = listAllCountryConfigsForExpansion();
    const codes = new Set(all.map((c) => c.countryCode));
    expect(codes.has("CA")).toBe(true);
    expect(codes.has("FR")).toBe(true);
  });

  it("produces regulation view with disclaimer", () => {
    const c = getCountryConfig("CA");
    expect(c).toBeDefined();
    const v = getRegulationViewFromConfig(c!);
    expect(v.disclaimer).toMatch(/not legal advice/i);
    expect(v.allowedActions.length).toBeGreaterThan(0);
  });

  it("localizes UI keys with fallback", () => {
    expect(tUi("dashboard.title", "fr")).toBeTruthy();
    expect(tUi("unknown.key", "en")).toBe("unknown.key");
  });

  it("resolves default locale and supported locales", () => {
    expect(defaultLocaleForCountry("CA")).toBe("en");
    expect(supportedLocalesForCountry("CA").length).toBeGreaterThan(0);
  });

  it("normalizes and formats currency for display", () => {
    const d = formatCurrencyDisplay(10_000, "CAD", "en-CA");
    expect(d.currency).toBe("CAD");
    expect(d.normalizedCents).toBe(normalizeToCadCents(10_000, "CAD"));
  });

  it("builds dashboard snapshot with pipeline and alerts", () => {
    const s = buildGlobalDashboardSnapshot();
    expect(s.countries.length).toBeGreaterThan(0);
    expect(s.pipeline.length).toBeGreaterThan(0);
    expect(Array.isArray(s.alerts)).toBe(true);
  });

  it("builds country detail view with integration notes", () => {
    const v = buildCountryDetailView("CA");
    expect(v?.country.countryCode).toBe("CA");
    expect(v?.explainability.length).toBeGreaterThan(0);
  });

  it("run launchCountry returns steps and disclaimer", () => {
    const r = launchCountry("CA");
    expect(r.ok).toBe(true);
    expect(r.steps.length).toBeGreaterThan(0);
    expect(r.disclaimer).toMatch(/not legal advice/i);
  });
});
