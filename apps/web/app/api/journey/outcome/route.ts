import { NextResponse } from "next/server";
import { engineFlags } from "@/config/feature-flags";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { logJourneyOutcomeEvent } from "@/modules/journey/hub-journey-monitoring.service";
import {
  isHubKey,
  type HubJourneySignalConfidence,
  type JourneyActorType,
  type JourneyOutcomeEventName,
} from "@/modules/journey/hub-journey.types";

export const dynamic = "force-dynamic";

const ALLOWED_EVENTS = new Set<JourneyOutcomeEventName>([
  "journey_banner_viewed",
  "journey_next_cta_clicked",
  "journey_copilot_suggestion_viewed",
  "journey_copilot_suggestion_clicked",
  "journey_blocker_viewed",
]);

const CONF_SET = new Set<HubJourneySignalConfidence>(["high", "medium", "low"]);
const ACTOR_SET = new Set<JourneyActorType>(["guest", "authenticated", "operator"]);

function clip(s: unknown, max: number): string {
  if (typeof s !== "string") return "";
  return s.trim().slice(0, max);
}

function clipNum(n: unknown): number | undefined {
  if (typeof n !== "number" || !Number.isFinite(n)) return undefined;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function clipIds(ids: unknown): string[] | undefined {
  if (!Array.isArray(ids)) return undefined;
  return ids
    .filter((x): x is string => typeof x === "string")
    .map((x) => x.trim().slice(0, 64))
    .filter(Boolean)
    .slice(0, 12);
}

export async function POST(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  const rl = checkRateLimit(`journey:outcome:${ip}`, { windowMs: 60_000, max: 200 });
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many events" },
      { status: 429, headers: getRateLimitHeaders(rl) },
    );
  }

  if (!engineFlags.hubJourneyAnalyticsV1) {
    return NextResponse.json({ ok: true, disabled: true });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const eventRaw = clip(body.event, 80);
  if (!eventRaw || !ALLOWED_EVENTS.has(eventRaw as JourneyOutcomeEventName)) {
    return NextResponse.json({ ok: false, error: "Invalid event" }, { status: 400 });
  }
  const event = eventRaw as JourneyOutcomeEventName;

  const hubRaw = clip(body.hub, 32).toLowerCase();
  if (!isHubKey(hubRaw)) {
    return NextResponse.json({ ok: false, error: "Invalid hub" }, { status: 400 });
  }

  const locale = clip(body.locale, 16) || "en";
  const country = clip(body.country, 8) || "ca";

  const actorRaw = clip(body.actorType, 24);
  if (!actorRaw || !ACTOR_SET.has(actorRaw as JourneyActorType)) {
    return NextResponse.json({ ok: false, error: "Invalid actorType" }, { status: 400 });
  }

  let confidence: HubJourneySignalConfidence | undefined;
  const confRaw = clip(body.confidence, 16);
  if (confRaw && CONF_SET.has(confRaw as HubJourneySignalConfidence)) {
    confidence = confRaw as HubJourneySignalConfidence;
  }

  const payload = {
    event,
    hub: hubRaw,
    locale,
    country,
    actorType: actorRaw as JourneyActorType,
    progressPercent: clipNum(body.progressPercent),
    currentStepId: clip(body.currentStepId, 64) || undefined,
    nextStepId: clip(body.nextStepId, 64) || undefined,
    blockerCount:
      typeof body.blockerCount === "number" && Number.isFinite(body.blockerCount)
        ? Math.max(0, Math.min(99, Math.floor(body.blockerCount)))
        : undefined,
    confidence,
    suggestionIds: clipIds(body.suggestionIds),
    correlationId: clip(body.correlationId, 128) || undefined,
    featureFlags: {
      journey: engineFlags.hubJourneyV1,
      copilot: engineFlags.hubCopilotV1,
      analytics: engineFlags.hubJourneyAnalyticsV1,
    },
  };

  try {
    logJourneyOutcomeEvent(payload);
  } catch {
    /* never throw */
  }

  return NextResponse.json({ ok: true });
}
