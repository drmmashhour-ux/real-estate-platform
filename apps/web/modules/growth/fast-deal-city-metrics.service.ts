/**
 * Per-city aggregates from Fast Deal source events + outcomes (real signals only).
 */

import { prisma } from "@/lib/db";
import { engineFlags } from "@/config/feature-flags";
import type { FastDealCityMetrics } from "@/modules/growth/fast-deal-city-comparison.types";
import { normalizeFastDealCityKey } from "@/modules/growth/fast-deal-city-normalize";

type SourceRow = {
  sourceType: string;
  sourceSubType: string;
  metadataJson: unknown;
};

type OutcomeRow = {
  outcomeType: string;
  metadataJson: unknown;
};

function metaRecord(m: unknown): Record<string, unknown> {
  if (m && typeof m === "object" && !Array.isArray(m)) return m as Record<string, unknown>;
  return {};
}

/** City taken from metadata.city or metadata.marketVariant when present. */
export function extractCityFromMetadata(meta: unknown): string | undefined {
  const r = metaRecord(meta);
  const c = r.city ?? r.marketVariant;
  return typeof c === "string" && c.trim() ? c.trim() : undefined;
}

function matchesCity(targetKey: string, meta: unknown): boolean {
  const label = extractCityFromMetadata(meta);
  if (!label) return false;
  return normalizeFastDealCityKey(label) === targetKey;
}

function countCompleteness(hasSourcing: boolean, hasLanding: boolean, hasPlaybook: boolean): FastDealCityMetrics["meta"]["dataCompleteness"] {
  const n = [hasSourcing, hasLanding, hasPlaybook].filter(Boolean).length;
  if (n >= 3) return "high";
  if (n === 2) return "medium";
  return "low";
}

/**
 * Pure aggregation from pre-fetched rows — used by comparison engine and tests.
 */
export function buildCityMetricsFromRows(
  cityDisplay: string,
  windowDays: number,
  events: SourceRow[],
  outcomes: OutcomeRow[],
): FastDealCityMetrics {
  const key = normalizeFastDealCityKey(cityDisplay);
  const warnings: string[] = [];

  let sourcingSessions = 0;
  let brokersFound = 0;
  let leadsFromLanding = 0;
  let playbookStarted = 0;
  let playbookCompleted = 0;
  let hasSourcing = false;
  let hasLanding = false;
  let hasPlaybook = false;

  for (const ev of events) {
    if (!matchesCity(key, ev.metadataJson)) continue;

    if (ev.sourceType === "broker_sourcing") {
      if (ev.sourceSubType === "session_started") sourcingSessions += 1;
      if (ev.sourceSubType === "broker_found_manual") brokersFound += 1;
      if (ev.sourceSubType === "session_started" || ev.sourceSubType === "query_copied" || ev.sourceSubType === "broker_found_manual") {
        hasSourcing = true;
      }
    }

    if (ev.sourceType === "landing_capture" && ev.sourceSubType === "lead_submitted") {
      hasLanding = true;
      leadsFromLanding += 1;
    }

    if (ev.sourceType === "closing_playbook") {
      hasPlaybook = true;
      if (ev.sourceSubType === "step_acknowledged") {
        const r = metaRecord(ev.metadataJson);
        const step = typeof r.step === "number" ? r.step : null;
        if (step === 1) playbookStarted += 1;
      }
      if (ev.sourceSubType === "playbook_session_completed") playbookCompleted += 1;
    }
  }

  let leadCapturedOutcomes = 0;
  let leadsQualified = 0;
  let meetingsBooked = 0;
  let dealsProgressed = 0;
  let dealsClosed = 0;

  for (const o of outcomes) {
    if (!matchesCity(key, o.metadataJson)) continue;
    switch (o.outcomeType) {
      case "lead_captured":
        leadCapturedOutcomes += 1;
        break;
      case "lead_qualified":
        leadsQualified += 1;
        break;
      case "meeting_booked":
        meetingsBooked += 1;
        break;
      case "deal_progressed":
        dealsProgressed += 1;
        break;
      case "deal_closed":
        dealsClosed += 1;
        break;
      default:
        break;
    }
  }

  const lcTotal = leadsFromLanding + leadCapturedOutcomes;
  const leadsCaptured = lcTotal > 0 ? lcTotal : undefined;

  if (leadsFromLanding > 0 && leadCapturedOutcomes > 0) {
    warnings.push(
      "Landing submits and outcome rows both counted toward captures — avoid double-tagging the same lead in ops.",
    );
  }

  if (playbookCompleted > 0 && playbookStarted === 0) {
    warnings.push(
      "Playbook completions exist without step-1 acknowledgement logs — completion ratio withheld until step logging is consistent.",
    );
  }

  const activity = {
    ...(sourcingSessions > 0 ? { sourcingSessions } : {}),
    ...(brokersFound > 0 ? { brokersFound } : {}),
    ...(leadsCaptured != null && leadsCaptured > 0 ? { leadsCaptured } : {}),
  };

  const execution = {
    ...(playbookStarted > 0 ? { playbookStarted } : {}),
    ...(playbookCompleted > 0 ? { playbookCompleted } : {}),
  };

  const progression = {
    ...(leadsQualified > 0 ? { leadsQualified } : {}),
    ...(meetingsBooked > 0 ? { meetingsBooked } : {}),
    ...(dealsProgressed > 0 ? { dealsProgressed } : {}),
    ...(dealsClosed > 0 ? { dealsClosed } : {}),
  };

  const meaningfulTouches =
    (activity.sourcingSessions ?? 0) +
    (activity.brokersFound ?? 0) +
    (activity.leadsCaptured ?? 0) +
    (execution.playbookStarted ?? 0) +
    (execution.playbookCompleted ?? 0) +
    leadsQualified +
    meetingsBooked +
    dealsProgressed +
    dealsClosed;

  const sampleSize = meaningfulTouches;

  if (sampleSize === 0) {
    warnings.push("No attributed events in this window — operators may need city labels on playbook logs or outcomes.");
  }

  const completeness = countCompleteness(hasSourcing || (activity.sourcingSessions ?? 0) > 0, hasLanding, hasPlaybook);

  return {
    city: cityDisplay,
    windowDays,
    activity,
    execution,
    progression,
    derived: {},
    meta: {
      sampleSize,
      dataCompleteness: completeness,
      warnings,
    },
  };
}

/** Single-city load from DB (same window rules as comparison engine). */
export async function buildCityMetrics(city: string, windowDays: number): Promise<FastDealCityMetrics | null> {
  if (!engineFlags.fastDealCityComparisonV1) return null;
  const since = new Date(Date.now() - windowDays * 86400000);
  const [events, outcomes] = await Promise.all([
    prisma.fastDealSourceEvent.findMany({
      where: { createdAt: { gte: since } },
      select: { sourceType: true, sourceSubType: true, metadataJson: true },
    }),
    prisma.fastDealOutcome.findMany({
      where: { createdAt: { gte: since } },
      select: { outcomeType: true, metadataJson: true },
    }),
  ]);
  return buildCityMetricsFromRows(city, windowDays, events, outcomes);
}
