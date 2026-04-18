import { NextResponse } from "next/server";
import { conversionEngineFlags } from "@/config/feature-flags";
import {
  conversionExperienceTierLabel,
  deriveConversionExperienceTier,
} from "@/modules/conversion/conversion-rollout-helpers";
import { getConversionMonitoringSnapshot } from "@/modules/conversion/conversion-monitoring.service";
import { requireAdminSession } from "@/lib/admin/require-admin";
import {
  isConversionKillSwitchActive,
  parseRolloutMode,
} from "@/config/rollout";

export const dynamic = "force-dynamic";

/**
 * Admin: conversion flags + server-side monitoring snapshot (in-process; resets per runtime).
 */
export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const flags = {
    FEATURE_CONVERSION_UPGRADE_V1: conversionEngineFlags.conversionUpgradeV1,
    FEATURE_INSTANT_VALUE_V1: conversionEngineFlags.instantValueV1,
    FEATURE_REAL_URGENCY_V1: conversionEngineFlags.realUrgencyV1,
  };

  const tier = deriveConversionExperienceTier(conversionEngineFlags);
  const monitoring = safeMonitoringSnapshot();

  return NextResponse.json({
    flags,
    rollout: {
      killSwitch: isConversionKillSwitchActive(),
      mode: parseRolloutMode(),
    },
    experienceTier: tier,
    experienceLabel: conversionExperienceTierLabel(tier),
    monitoring,
    monitoringNote:
      "Counters reflect this Node.js process only (SSR/API paths). Browser lead events live in the visitor tab — use logs [conversion] or enable NEXT_PUBLIC_CONVERSION_MONITORING_DEBUG on /get-leads.",
  });
}

function safeMonitoringSnapshot() {
  try {
    return getConversionMonitoringSnapshot();
  } catch {
    return null;
  }
}
