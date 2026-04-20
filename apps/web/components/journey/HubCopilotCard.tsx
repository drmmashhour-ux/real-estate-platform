"use client";

import Link from "next/link";
import { postJourneyOutcome } from "@/lib/journey/post-journey-outcome";
import type {
  HubCopilotState,
  HubJourneySignalConfidence,
  HubKey,
  JourneyActorType,
} from "@/modules/journey/hub-journey.types";
import { useJourneyCorrelationId } from "./JourneyCorrelationProvider";

export function HubCopilotCard({
  state,
  basePath,
  analyticsEnabled,
  hub,
  locale,
  country,
  actorType,
  progressPercent,
  currentStepId,
  nextStepId,
  blockerCount,
}: {
  state: HubCopilotState | null;
  basePath: string;
  analyticsEnabled?: boolean;
  hub?: HubKey;
  locale?: string;
  country?: string;
  actorType?: JourneyActorType;
  progressPercent?: number;
  currentStepId?: string;
  nextStepId?: string;
  blockerCount?: number;
}) {
  const correlationId = useJourneyCorrelationId();

  if (!state || state.suggestions.length === 0) return null;

  const confidence: HubJourneySignalConfidence | undefined = state.signalConfidence;

  const trackSuggestionClick = (suggestionId: string) => {
    if (
      !analyticsEnabled ||
      !hub ||
      !locale ||
      !country ||
      actorType === undefined ||
      typeof progressPercent !== "number"
    ) {
      return;
    }
    void postJourneyOutcome({
      event: "journey_copilot_suggestion_clicked",
      hub,
      locale,
      country,
      actorType,
      progressPercent,
      currentStepId: currentStepId ?? null,
      nextStepId: nextStepId ?? null,
      blockerCount,
      confidence,
      suggestionIds: [suggestionId],
      correlationId: correlationId ?? undefined,
    });
  };

  return (
    <div
      id="hub-copilot-anchor"
      className="rounded-xl border border-amber-500/20 bg-zinc-950/80 p-4 backdrop-blur-sm"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-300/90">
        Copilot suggestions
      </p>
      <ul className="mt-3 space-y-3">
        {state.suggestions.map((s) => {
          const href =
            s.route &&
            (s.route.startsWith("/")
              ? s.route
              : `${basePath.replace(/\/$/, "")}/${s.route.replace(/^\//, "")}`);
          return (
            <li
              key={s.id}
              className="rounded-lg border border-white/5 bg-black/50 p-3 text-sm text-zinc-200"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium text-zinc-50">{s.title}</span>
                <span
                  className={`shrink-0 rounded px-2 py-0.5 text-[10px] uppercase ${
                    s.priority === "high"
                      ? "bg-amber-500/20 text-amber-200"
                      : s.priority === "medium"
                        ? "bg-zinc-700 text-zinc-200"
                        : "bg-zinc-800 text-zinc-400"
                  }`}
                >
                  {s.priority}
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-zinc-400">{s.explanation}</p>
              <p className="mt-2 text-xs text-amber-200/80">{s.suggestedAction}</p>
              {href ? (
                <Link
                  href={href}
                  className="mt-2 inline-block text-xs font-semibold text-amber-400 hover:text-amber-300"
                  onClick={() => trackSuggestionClick(s.id)}
                >
                  Go →
                </Link>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
