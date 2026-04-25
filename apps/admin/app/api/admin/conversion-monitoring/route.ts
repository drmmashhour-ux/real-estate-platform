import { NextResponse } from "next/server";
import { requireAdminSurfaceSession } from "@/lib/admin/require-admin-surface-session";
import { computeConversionMonitoringAlerts } from "@/modules/conversion/conversion-monitoring-alerts";
import {
  getConversionMonitoringRecentEvents,
  getConversionMonitoringSnapshot,
} from "@/modules/conversion/conversion-monitoring.service";
import { isConversionKillSwitchActive, parseRolloutMode, traceConversionRolloutDecision } from "@/config/rollout";
import {
  computeFunnelDropoffs,
  computeFunnelRates,
  computeFunnelSuggestions,
  getFunnelSnapshot,
  getVariantBuckets,
  pickBestVariantForSurface,
} from "@/modules/conversion/funnel-metrics.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminSurfaceSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const snapshot = getConversionMonitoringSnapshot();
  const alerts = computeConversionMonitoringAlerts(snapshot);
  const recentEvents = getConversionMonitoringRecentEvents();
  const rates = computeFunnelRates();

  return NextResponse.json({
    snapshot,
    alerts,
    recentEvents,
    rollout: {
      killSwitch: isConversionKillSwitchActive(),
      mode: parseRolloutMode(),
      /** Explicit server-side rollout inputs (pathname not set on this aggregate endpoint). */
      trace: traceConversionRolloutDecision(),
    },
    funnel: {
      snapshot: getFunnelSnapshot(),
      rates,
      dropoffs: computeFunnelDropoffs(),
      suggestions: computeFunnelSuggestions(rates),
      variants: getVariantBuckets(),
      bestVariants: {
        get_leads_submit_cta: pickBestVariantForSurface("get_leads_submit_cta"),
      },
    },
  });
}
