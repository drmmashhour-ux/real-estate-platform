"use client";

import * as React from "react";
import type { GrowthGovernancePolicySnapshot } from "@/modules/growth/growth-governance-policy.types";
import type { GrowthPolicyDomain } from "@/modules/growth/growth-governance-policy.types";
import { formatPolicyModeLabel, getPolicyModeForDomain } from "@/modules/growth/growth-governance-policy-query.service";

/**
 * Display-only mode badge from policy snapshot API. No behavioral side effects.
 */
export function GrowthGovernancePolicyDomainBadge({
  domain,
  enabled,
}: {
  domain: GrowthPolicyDomain;
  /** When false, renders nothing. */
  enabled?: boolean;
}) {
  const [label, setLabel] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!enabled) {
      setLabel(null);
      return;
    }
    let cancelled = false;
    void fetch("/api/growth/governance-policy", { credentials: "same-origin" })
      .then(async (r) => {
        const j = (await r.json()) as { error?: string; snapshot?: GrowthGovernancePolicySnapshot };
        if (!r.ok) return null;
        return j.snapshot ?? null;
      })
      .then((snap) => {
        if (cancelled || !snap) return;
        const mode = getPolicyModeForDomain(domain, snap);
        setLabel(formatPolicyModeLabel(mode));
      })
      .catch(() => {
        if (!cancelled) setLabel(null);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, domain]);

  if (!enabled || !label) return null;

  return (
    <span className="inline-flex items-center rounded-full border border-zinc-600/80 bg-zinc-900/80 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
      Policy: {label}
    </span>
  );
}
