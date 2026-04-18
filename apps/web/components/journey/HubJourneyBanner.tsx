import { engineFlags } from "@/config/feature-flags";
import { buildHubJourneyContextFromDb } from "@/modules/journey/hub-journey-context.builder";
import { buildHubCopilotState } from "@/modules/journey/hub-copilot.service";
import { buildHubJourneyPlan } from "@/modules/journey/hub-journey-state.service";
import type { HubKey } from "@/modules/journey/hub-journey.types";
import { HubBlockersCard } from "./HubBlockersCard";
import { HubCopilotCard } from "./HubCopilotCard";
import { HubJourneyNextCta } from "./HubJourneyNextCta";
import { HubJourneyStepper } from "./HubJourneyStepper";
import { HubNextStepCard } from "./HubNextStepCard";

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

  const ctx = await buildHubJourneyContextFromDb({ hub, userId, locale, country });
  const plan = engineFlags.hubJourneyV1 ? buildHubJourneyPlan(hub, ctx) : null;
  const copilot = engineFlags.hubCopilotV1
    ? buildHubCopilotState(hub, ctx, plan ?? undefined)
    : null;

  const basePath = `/${locale}/${country}`;
  const blockers = copilot?.blockers ?? [];

  return (
    <section
      id="hub-journey-anchor"
      className="mb-8 space-y-4 rounded-2xl border border-amber-500/15 bg-gradient-to-b from-zinc-950 via-black to-zinc-950 p-4 shadow-inner shadow-black/60"
    >
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
        {(engineFlags.hubCopilotV1 || engineFlags.hubJourneyV1) && <HubJourneyNextCta />}
      </div>

      {engineFlags.hubJourneyV1 ? <HubJourneyStepper plan={plan} /> : null}
      {blockers.length > 0 ? <HubBlockersCard blockers={blockers} /> : null}
      {engineFlags.hubJourneyV1 ? <HubNextStepCard plan={plan} basePath={basePath} /> : null}
      {engineFlags.hubCopilotV1 ? <HubCopilotCard state={copilot} basePath={basePath} /> : null}
    </section>
  );
}
