/**
 * Conversion engine rollout discipline — kill switch, mode, and effective flags.
 * Does not alter conversion copy/math; only gates whether features apply.
 */

import { conversionEngineFlags } from "@/config/feature-flags";

export type RolloutMode = "off" | "internal" | "partial" | "full";

export type ConversionRolloutContext = {
  /** Normalized pathname e.g. /en/ca/get-leads or /get-leads */
  pathname?: string;
  /** Admin / internal reviewer */
  isPrivilegedUser?: boolean;
};

export type EffectiveConversionFlags = {
  conversionUpgradeV1: boolean;
  instantValueV1: boolean;
  realUrgencyV1: boolean;
};

const ALL_OFF: EffectiveConversionFlags = {
  conversionUpgradeV1: false,
  instantValueV1: false,
  realUrgencyV1: false,
};

/** Kill switch: immediate global off (server + client bundles — set both FEATURE_* and NEXT_PUBLIC_* for CDN safety). */
export function isConversionKillSwitchActive(): boolean {
  return (
    process.env.FEATURE_CONVERSION_KILL_SWITCH === "1" ||
    process.env.FEATURE_CONVERSION_KILL_SWITCH === "true" ||
    process.env.NEXT_PUBLIC_FEATURE_CONVERSION_KILL_SWITCH === "1" ||
    process.env.NEXT_PUBLIC_FEATURE_CONVERSION_KILL_SWITCH === "true"
  );
}

export function parseRolloutMode(): RolloutMode {
  const raw = (
    process.env.CONVERSION_ROLLOUT_MODE ||
    process.env.NEXT_PUBLIC_CONVERSION_ROLLOUT_MODE ||
    "full"
  )
    .trim()
    .toLowerCase();
  if (raw === "off" || raw === "internal" || raw === "partial" || raw === "full") return raw;
  return "full";
}

function partialPathAllowlist(): string[] {
  const csv =
    process.env.CONVERSION_ROLLOUT_PARTIAL_PATHS || process.env.NEXT_PUBLIC_CONVERSION_ROLLOUT_PARTIAL_PATHS || "";
  return csv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Strips optional `/{locale}/{country}/` prefix so partial allowlists can use `/get-leads`
 * while the router pathname is e.g. `/en/ca/get-leads`.
 */
export function normalizePathForRollout(pathname: string): string {
  const raw = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const segments = raw.split("/").filter(Boolean);
  if (segments.length >= 2) {
    const [a, b] = segments;
    if (/^[a-z]{2}(-[a-zA-Z]{2,4})?$/i.test(a) && /^[a-z]{2}$/i.test(b)) {
      const rest = segments.slice(2).join("/");
      return rest ? `/${rest}` : "/";
    }
  }
  return raw;
}

function pathnameMatchesAllowlist(pathname: string, prefixes: string[]): boolean {
  const norm = normalizePathForRollout(pathname);
  for (const p of prefixes) {
    const prefix = normalizePathForRollout(p.startsWith("/") ? p : `/${p}`);
    if (norm === prefix || norm.startsWith(prefix.endsWith("/") ? prefix : `${prefix}/`)) return true;
  }
  return false;
}

/**
 * Applies kill switch + rollout mode to raw env flags.
 */
export function applyConversionRollout(
  raw: EffectiveConversionFlags = { ...conversionEngineFlags },
  context?: ConversionRolloutContext,
): EffectiveConversionFlags {
  if (isConversionKillSwitchActive()) return { ...ALL_OFF };

  const mode = parseRolloutMode();
  if (mode === "off") return { ...ALL_OFF };
  if (mode === "full") return { ...raw };

  if (mode === "internal") {
    if (context?.isPrivilegedUser) return { ...raw };
    return { ...ALL_OFF };
  }

  if (mode === "partial") {
    const allow = partialPathAllowlist();
    if (!context?.pathname || allow.length === 0) return { ...ALL_OFF };
    if (pathnameMatchesAllowlist(context.pathname, allow)) return { ...raw };
    return { ...ALL_OFF };
  }

  return { ...raw };
}

/** Primary entry: raw FEATURE_* flags × rollout × kill switch. */
export function getConversionEngineFlagsEffective(context?: ConversionRolloutContext): EffectiveConversionFlags {
  const pathname =
    context?.pathname != null && context.pathname !== ""
      ? normalizePathForRollout(context.pathname)
      : undefined;
  return applyConversionRollout({ ...conversionEngineFlags }, { ...context, pathname });
}

/** Maps effective flags to a single operator-facing mode label. */
export function effectiveFlagsToDisplayMode(flags: EffectiveConversionFlags): "Base" | "Conversion only" | "Conversion + Instant Value" | "Full (with urgency)" {
  if (!flags.conversionUpgradeV1) return "Base";
  if (!flags.instantValueV1) return "Conversion only";
  if (!flags.realUrgencyV1) return "Conversion + Instant Value";
  return "Full (with urgency)";
}
