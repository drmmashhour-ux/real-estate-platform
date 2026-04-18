"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { conversionEngineFlags } from "@/config/feature-flags";
import {
  effectiveFlagsToDisplayMode,
  getConversionEngineFlagsEffective,
  isConversionKillSwitchActive,
  parseRolloutMode,
} from "@/config/rollout";

/**
 * Dev / debug-only: raw env flags, rollout mode, path-effective flags, and display tier.
 * Renders when `NODE_ENV !== "production"` OR `?debug=1` (client-detected).
 */
export function ConversionFlagsPanel() {
  const pathname = usePathname() || "";
  const [debugParam, setDebugParam] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const v = new URLSearchParams(window.location.search).get("debug");
    if (v === "1") setDebugParam(true);
  }, [pathname]);

  const isNonProd = process.env.NODE_ENV !== "production";
  const visible = isNonProd || debugParam;
  if (!visible) return null;

  const effective = useMemo(
    () => getConversionEngineFlagsEffective({ pathname: pathname || undefined }),
    [pathname],
  );

  const modeLabel = effectiveFlagsToDisplayMode(effective);

  return (
    <div className="pointer-events-none fixed bottom-0 left-0 z-[100] max-w-[min(100vw,420px)] p-2 text-left">
      <div className="pointer-events-auto rounded-lg border border-cyan-800/60 bg-black/90 px-3 py-2 font-mono text-[10px] leading-snug text-cyan-100 shadow-lg">
        <p className="font-semibold text-cyan-300">Conversion flags (dev)</p>
        <p className="mt-1 text-slate-400">
          killSwitch={String(isConversionKillSwitchActive())} · rolloutMode={parseRolloutMode()}
        </p>
        <p className="mt-1 break-all text-slate-300">
          FEATURE_CONVERSION_UPGRADE_V1={String(conversionEngineFlags.conversionUpgradeV1)} ·
          FEATURE_INSTANT_VALUE_V1={String(conversionEngineFlags.instantValueV1)} · FEATURE_REAL_URGENCY_V1=
          {String(conversionEngineFlags.realUrgencyV1)}
        </p>
        <p className="mt-1 text-amber-200/90">Path: {pathname || "—"}</p>
        <p className="mt-1 text-white">
          effective upgrade={String(effective.conversionUpgradeV1)} · iv={String(effective.instantValueV1)} · urgency=
          {String(effective.realUrgencyV1)}
        </p>
        <p className="mt-1 text-emerald-300/90">Current mode: {modeLabel}</p>
      </div>
    </div>
  );
}
