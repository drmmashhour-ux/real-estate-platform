import { isDemoMode } from "@/lib/demo/isDemoMode";
import { logDbError } from "@/lib/observability/structured-log";
import { query } from "@/lib/sql";

type FunnelBySourceRow = {
  source: string;
  visits: string;
  signups: string;
  bookings: string;
};

type FunnelTotalRow = {
  visits: string;
  signups: string;
  bookings: string;
};

export type GrowthAction = {
  type: "improve_conversion" | "increase_traffic" | "improve_onboarding";
  priority: "high" | "medium" | "low";
  description: string;
};

export type GrowthRecommendationsBySource = {
  source: string;
  visits: number;
  signups: number;
  bookings: number;
  signupRate: number;
  bookingRate: number;
  recommendation: string;
};

export type GrowthRecommendationsResult =
  | {
      message: string;
      _demo: true;
    }
  | {
      _demo: false;
      visits: number;
      signups: number;
      bookings: number;
      signupRate: number;
      bookingRate: number;
      recommendation: string;
      actions: GrowthAction[];
      bySource: GrowthRecommendationsBySource[];
      /** Shaped for `d.recommendations` consumers (dashboard cards). */
      recommendations: {
        bySource: GrowthRecommendationsBySource[];
        actions: GrowthAction[];
        aggregate: {
          visits: number;
          signups: number;
          bookings: number;
          signupRate: number;
          bookingRate: number;
          recommendation: string;
        };
        topTopics: unknown[];
        topHooks: unknown[];
        topPlatforms: unknown[];
        taxonomyMix: null;
      };
    };

export function buildActions(metrics: { visits: number; signups: number; bookings: number }): GrowthAction[] {
  const actions: GrowthAction[] = [];

  const signupRate = metrics.signups / Math.max(1, metrics.visits);
  const bookingRate = metrics.bookings / Math.max(1, metrics.signups);

  if (signupRate < 0.05) {
    actions.push({
      type: "improve_conversion",
      priority: "high",
      description: "Improve landing page (headline + CTA)",
    });
  }

  if (bookingRate < 0.1) {
    actions.push({
      type: "improve_onboarding",
      priority: "high",
      description: "Reduce friction in booking flow",
    });
  }

  if (metrics.visits < 100) {
    actions.push({
      type: "increase_traffic",
      priority: "high",
      description: "Increase outreach or run ads",
    });
  }

  return actions;
}

function aggregateCopy(signupRate: number, bookingRate: number, visits: number): string {
  if (signupRate < 0.05) {
    return "Improve landing CTA and trust section";
  }
  if (bookingRate < 0.1) {
    return "Improve onboarding and booking flow";
  }
  if (visits < 100) {
    return "Increase top-of-funnel reach (outreach or paid)";
  }
  return "Scale traffic on your best channels and monitor week-over-week";
}

async function persistGrowthActionSnapshot(actions: GrowthAction[]): Promise<void> {
  if (actions.length === 0 || process.env.GROWTH_ACTION_LOG === "0") {
    return;
  }
  await query(
    `INSERT INTO "GrowthActionLog" ("id", "action", "created_at")
     VALUES (gen_random_uuid()::text, $1, NOW())`,
    [JSON.stringify({ actions, source: "growth_recommendations" })]
  );
}

function growthEngineFailureResult(err: unknown): GrowthRecommendationsResult {
  const msg = err instanceof Error ? err.message : String(err);
  logDbError("getGrowthRecommendations", err);
  const z = { visits: 0, signups: 0, bookings: 0, signupRate: 0, bookingRate: 0, recommendation: `Growth data unavailable: ${msg.slice(0, 200)}` };
  return {
    _demo: false,
    ...z,
    actions: [],
    bySource: [],
    recommendations: {
      bySource: [],
      actions: [],
      aggregate: { ...z },
      topTopics: [],
      topHooks: [],
      topPlatforms: [],
      taxonomyMix: null,
    },
  };
}

/**
 * 30d funnel: aggregate metrics + per-`utm_source` breakdown from `growth_events`. Disabled in `DEMO_MODE=1` (no SQL).
 * Persists a single audit row in `GrowthActionLog` when there are actions (no demo data in service path).
 */
export async function getGrowthRecommendations(): Promise<GrowthRecommendationsResult> {
  if (isDemoMode) {
    return {
      message: "Growth engine disabled in demo mode",
      _demo: true,
    };
  }

  try {
  const [totRows, rows] = await Promise.all([
    query<FunnelTotalRow>(`
      SELECT
        COUNT(*) FILTER (
          WHERE "event_name" IN ('landing_view', 'listing_view', 'page_view')
        )::text AS visits,
        COUNT(*) FILTER (
          WHERE "event_name" IN ('signup_success', 'host_signup')
        )::text AS signups,
        COUNT(*) FILTER (WHERE "event_name" = 'booking_completed')::text AS bookings
      FROM growth_events
      WHERE "created_at" >= (NOW() - interval '30 days')
    `),
    query<FunnelBySourceRow>(`
      SELECT
        COALESCE(NULLIF(TRIM(LOWER("utm_source")), ''), 'direct') AS source,
        COUNT(*) FILTER (
          WHERE "event_name" IN ('landing_view', 'listing_view', 'page_view')
        )::text AS visits,
        COUNT(*) FILTER (
          WHERE "event_name" IN ('signup_success', 'host_signup')
        )::text AS signups,
        COUNT(*) FILTER (WHERE "event_name" = 'booking_completed')::text AS bookings
      FROM growth_events
      WHERE "created_at" >= (NOW() - interval '30 days')
      GROUP BY 1
      HAVING COUNT(*) FILTER (
        WHERE "event_name" IN ('landing_view', 'listing_view', 'page_view')
      ) > 0
         OR COUNT(*) FILTER (WHERE "event_name" IN ('signup_success', 'host_signup')) > 0
         OR COUNT(*) FILTER (WHERE "event_name" = 'booking_completed') > 0
      ORDER BY
        COUNT(*) FILTER (
          WHERE "event_name" IN ('landing_view', 'listing_view', 'page_view')
        ) DESC
      LIMIT 100
    `),
  ]);

  const t = totRows[0];
  const visits = Math.max(0, t ? Number(t.visits) || 0 : 0);
  const signups = Math.max(0, t ? Number(t.signups) || 0 : 0);
  const bookings = Math.max(0, t ? Number(t.bookings) || 0 : 0);
  const signupRate = visits > 0 ? signups / visits : 0;
  const bookingRate = signups > 0 ? bookings / signups : 0;

  const actions = buildActions({ visits, signups, bookings });
  const recommendation = aggregateCopy(signupRate, bookingRate, visits);

  const bySource: GrowthRecommendationsBySource[] = rows.map((r) => {
    const v = Math.max(0, Number(r.visits) || 0);
    const s = Math.max(0, Number(r.signups) || 0);
    const b = Math.max(0, Number(r.bookings) || 0);
    const sr = v > 0 ? s / v : 0;
    const br = s > 0 ? b / s : 0;
    return {
      source: r.source,
      visits: v,
      signups: s,
      bookings: b,
      signupRate: sr,
      bookingRate: br,
      recommendation: sr < 0.05 ? "Improve landing CTA and trust section" : br < 0.1 ? "Improve onboarding and booking flow" : "Scale traffic source",
    };
  });

  try {
    await persistGrowthActionSnapshot(actions);
  } catch (e) {
    console.error("[growthEngine] persist GrowthActionLog failed", e);
  }

  return {
    _demo: false,
    visits,
    signups,
    bookings,
    signupRate,
    bookingRate,
    recommendation,
    actions,
    bySource,
    recommendations: {
      bySource,
      actions,
      aggregate: {
        visits,
        signups,
        bookings,
        signupRate,
        bookingRate,
        recommendation,
      },
      topTopics: [],
      topHooks: [],
      topPlatforms: [],
      taxonomyMix: null,
    },
  };
  } catch (e) {
    return growthEngineFailureResult(e);
  }
}
