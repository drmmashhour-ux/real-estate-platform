import { engineFlags } from "@/config/feature-flags";
import { buildHubJourneyContextFromDb } from "@/modules/journey/hub-journey-context.builder";
import { buildHubCopilotState } from "@/modules/journey/hub-copilot.service";
import { resolveJourneyActorType } from "@/modules/journey/journey-outcome.helpers";
import { buildHubJourneyPlan } from "@/modules/journey/hub-journey-state.service";
import { isHubJourneyRolloutEnabled } from "@/modules/journey/hub-journey-rollout";
import {
  logJourneyStructuredKind,
} from "@/modules/journey/hub-journey-monitoring.service";
import type { HubKey } from "@/modules/journey/hub-journey.types";
import { HubBlockersCard } from "./HubBlockersCard";
import { HubCopilotCard } from "./HubCopilotCard";
import { HubJourneyAnalyticsBeacon } from "./HubJourneyAnalyticsBeacon";
import { HubJourneyNextCta } from "./HubJourneyNextCta";
import { HubJourneyStepper } from "./HubJourneyStepper";
import { HubNextStepCard } from "./HubNextStepCard";
import { JourneyCorrelationProvider } from "./JourneyCorrelationProvider";

export async function HubJourneyBanner({
  hub,
  locale,
  country,
  userId,
}: {
  hub: HubKey;
  locale: string;
  country: string;
  userId: string | null;
}) {
  if (!engineFlags.hubJourneyV1 && !engineFlags.hubCopilotV1) {
    return null;
  }

  if (!isHubJourneyRolloutEnabled(hub)) {
    return null;
  }

  const ctx = await buildHubJourneyContextFromDb({ hub, userId, locale, country });
  const plan = engineFlags.hubJourneyV1 ? buildHubJourneyPlan(hub, ctx) : null;
  const copilot = engineFlags.hubCopilotV1
    ? buildHubCopilotState(hub, ctx, plan ?? undefined)
    : null;

  const basePath = `/${locale}/${country}`;
  const blockers = copilot?.blockers ?? [];
  const analyticsEnabled =
    engineFlags.hubJourneyAnalyticsV1 && isHubJourneyRolloutEnabled(hub);
  const actorType = resolveJourneyActorType(hub, userId);

  try {
    logJourneyStructuredKind("banner_rendered", {
      hub,
      locale,
      country,
      actorType,
      progress: plan?.progressPercent,
      blockerCount: blockers.length,
      confidence: plan?.signalConfidence,
      flags: {
        journey: engineFlags.hubJourneyV1,
        copilot: engineFlags.hubCopilotV1,
        analytics: engineFlags.hubJourneyAnalyticsV1,
      },
    });
  } catch {
    /* noop */
  }

  const suggestionIds = copilot?.suggestions.map((s) => s.id) ?? [];

  return (
    <JourneyCorrelationProvider>
      <section
        id="hub-journey-anchor"
        className="mb-8 space-y-4 rounded-2xl border border-amber-500/15 bg-gradient-to-b from-zinc-950 via-black to-zinc-950 p-4 shadow-inner shadow-black/60"
      >
        <HubJourneyAnalyticsBeacon
          enabled={analyticsEnabled}
          hub={hub}
          locale={locale}
          country={country}
          actorType={actorType}
          progressPercent={plan?.progressPercent ?? 0}
          currentStepId={plan?.currentStepId}
          nextStepId={plan?.nextStepId}
          blockerCount={blockers.length}
          confidence={plan?.signalConfidence}
          suggestionIds={suggestionIds}
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-400/80">
              Guided journey
            </p>
            <h2 className="text-lg font-semibold tracking-tight text-zinc-50">
              {plan?.title ?? "Your hub copilot"}
            </h2>
            <p className="mt-1 max-w-prose text-xs text-zinc-400">{plan?.description}</p>
          </div>
          {(engineFlags.hubCopilotV1 || engineFlags.hubJourneyV1) && (
            <HubJourneyNextCta
              analyticsEnabled={analyticsEnabled}
              hub={hub}
              locale={locale}
              country={country}
              actorType={actorType}
              progressPercent={plan?.progressPercent ?? 0}
              currentStepId={plan?.currentStepId}
              nextStepId={plan?.nextStepId}
              blockerCount={blockers.length}
              confidence={plan?.signalConfidence}
            />
          )}
        </div>

        {engineFlags.hubJourneyV1 ? <HubJourneyStepper plan={plan} /> : null}
        {blockers.length > 0 ? <HubBlockersCard blockers={blockers} /> : null}
        {engineFlags.hubJourneyV1 ? <HubNextStepCard plan={plan} basePath={basePath} /> : null}
        {engineFlags.hubCopilotV1 ? (
          <HubCopilotCard
            state={copilot}
            basePath={basePath}
            analyticsEnabled={analyticsEnabled}
            hub={hub}
            locale={locale}
            country={country}
            actorType={actorType}
            progressPercent={plan?.progressPercent ?? 0}
            currentStepId={plan?.currentStepId}
            nextStepId={plan?.nextStepId}
            blockerCount={blockers.length}
          />
        ) : null}
      </section>
    </JourneyCorrelationProvider>
  );
}
