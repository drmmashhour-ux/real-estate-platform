import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  applyConversionRollout,
  effectiveFlagsToDisplayMode,
  getConversionEngineFlagsEffective,
  isConversionKillSwitchActive,
  normalizePathForRollout,
  parseRolloutMode,
} from "./rollout";

describe("normalizePathForRollout", () => {
  it("strips locale and country segments", () => {
    expect(normalizePathForRollout("/en/ca/get-leads")).toBe("/get-leads");
    expect(normalizePathForRollout("/fr/ca/listings/x")).toBe("/listings/x");
  });

  it("leaves paths without locale prefix unchanged", () => {
    expect(normalizePathForRollout("/get-leads")).toBe("/get-leads");
    expect(normalizePathForRollout("get-leads")).toBe("/get-leads");
  });
});

describe("effectiveFlagsToDisplayMode", () => {
  it("maps flag combinations to operator labels", () => {
    expect(
      effectiveFlagsToDisplayMode({
        conversionUpgradeV1: false,
        instantValueV1: false,
        realUrgencyV1: false,
      }),
    ).toBe("Base");
    expect(
      effectiveFlagsToDisplayMode({
        conversionUpgradeV1: true,
        instantValueV1: false,
        realUrgencyV1: false,
      }),
    ).toBe("Conversion only");
    expect(
      effectiveFlagsToDisplayMode({
        conversionUpgradeV1: true,
        instantValueV1: true,
        realUrgencyV1: false,
      }),
    ).toBe("Conversion + Instant Value");
    expect(
      effectiveFlagsToDisplayMode({
        conversionUpgradeV1: true,
        instantValueV1: true,
        realUrgencyV1: true,
      }),
    ).toBe("Full (with urgency)");
  });
});

describe("applyConversionRollout", () => {
  const allOn = { conversionUpgradeV1: true, instantValueV1: true, realUrgencyV1: true };

  beforeEach(() => {
    vi.stubEnv("FEATURE_CONVERSION_KILL_SWITCH", "");
    vi.stubEnv("CONVERSION_ROLLOUT_MODE", "full");
    vi.stubEnv("CONVERSION_ROLLOUT_PARTIAL_PATHS", "");
  });

  it("kill switch forces all flags off", () => {
    vi.stubEnv("FEATURE_CONVERSION_KILL_SWITCH", "1");
    expect(applyConversionRollout(allOn, {})).toEqual({
      conversionUpgradeV1: false,
      instantValueV1: false,
      realUrgencyV1: false,
    });
  });

  it("mode off zeros flags", () => {
    vi.stubEnv("FEATURE_CONVERSION_KILL_SWITCH", "");
    vi.stubEnv("CONVERSION_ROLLOUT_MODE", "off");
    expect(applyConversionRollout(allOn, {})).toEqual({
      conversionUpgradeV1: false,
      instantValueV1: false,
      realUrgencyV1: false,
    });
  });

  it("internal requires privileged user", () => {
    vi.stubEnv("CONVERSION_ROLLOUT_MODE", "internal");
    expect(applyConversionRollout(allOn, { isPrivilegedUser: false })).toEqual({
      conversionUpgradeV1: false,
      instantValueV1: false,
      realUrgencyV1: false,
    });
    expect(applyConversionRollout(allOn, { isPrivilegedUser: true })).toEqual(allOn);
  });

  it("partial requires allowlisted normalized path", () => {
    vi.stubEnv("CONVERSION_ROLLOUT_MODE", "partial");
    vi.stubEnv("CONVERSION_ROLLOUT_PARTIAL_PATHS", "/get-leads,/listings");
    expect(applyConversionRollout(allOn, { pathname: "/en/ca/get-leads" })).toEqual(allOn);
    expect(applyConversionRollout(allOn, { pathname: "/pricing" })).toEqual({
      conversionUpgradeV1: false,
      instantValueV1: false,
      realUrgencyV1: false,
    });
  });

  it("partial with empty allowlist is off everywhere", () => {
    vi.stubEnv("CONVERSION_ROLLOUT_MODE", "partial");
    vi.stubEnv("CONVERSION_ROLLOUT_PARTIAL_PATHS", "");
    expect(applyConversionRollout(allOn, { pathname: "/en/ca/get-leads" })).toEqual({
      conversionUpgradeV1: false,
      instantValueV1: false,
      realUrgencyV1: false,
    });
  });
});

describe("parseRolloutMode and kill switch helpers", () => {
  beforeEach(() => {
    vi.stubEnv("FEATURE_CONVERSION_KILL_SWITCH", "");
    vi.stubEnv("CONVERSION_ROLLOUT_MODE", "");
  });

  it("defaults to full when unset", () => {
    expect(parseRolloutMode()).toBe("full");
  });

  it("detects kill switch env", () => {
    vi.stubEnv("FEATURE_CONVERSION_KILL_SWITCH", "true");
    expect(isConversionKillSwitchActive()).toBe(true);
  });
});

describe("getConversionEngineFlagsEffective", () => {
  beforeEach(() => {
    vi.stubEnv("FEATURE_CONVERSION_KILL_SWITCH", "");
    vi.stubEnv("CONVERSION_ROLLOUT_MODE", "full");
  });

  it("does not throw when pathname includes locale segments", () => {
    vi.stubEnv("CONVERSION_ROLLOUT_MODE", "partial");
    vi.stubEnv("CONVERSION_ROLLOUT_PARTIAL_PATHS", "/get-leads");
    expect(() => getConversionEngineFlagsEffective({ pathname: "/en/ca/get-leads" })).not.toThrow();
  });
});
