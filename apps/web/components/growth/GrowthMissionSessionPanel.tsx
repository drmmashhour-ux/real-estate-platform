"use client";

import * as React from "react";
import Link from "next/link";
import { growthMissionControlFlags } from "@/config/feature-flags";
import type { GrowthMissionControlSummary } from "@/modules/growth/growth-mission-control.types";
import type {
  MissionControlActionBundle,
  MissionControlNavTarget,
} from "@/modules/growth/growth-mission-control-action.types";
import { buildMissionControlHref } from "@/modules/growth/growth-mission-control-nav.constants";
import { buildMissionSession, summarizeMissionSession } from "@/modules/growth/growth-mission-session.service";
import type { MissionSession, MissionSessionStep } from "@/modules/growth/growth-mission-session.types";
import {
  recordMissionSessionAbandoned,
  recordMissionSessionCompleted,
  recordMissionSessionStarted,
  recordMissionSessionStepCompleted,
} from "@/modules/growth/growth-mission-session-monitoring.service";

const STORAGE_KEY = "lecipm.growthMissionSession.v1";

function readStored(): MissionSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const j = JSON.parse(raw) as MissionSession;
    if (!j?.id || !Array.isArray(j.steps)) return null;
    return j;
  } catch {
    return null;
  }
}

function writeStored(session: MissionSession | null): void {
  try {
    if (typeof window === "undefined") return;
    if (!session) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    /* noop */
  }
}

export function GrowthMissionSessionPanel({
  locale,
  country,
  summary,
  actionBundle,
}: {
  locale: string;
  country: string;
  summary: GrowthMissionControlSummary;
  actionBundle: MissionControlActionBundle;
}) {
  const [session, setSession] = React.useState<MissionSession | null>(null);

  React.useEffect(() => {
    setSession(readStored());
  }, []);

  const startSession = React.useCallback(() => {
    if (!growthMissionControlFlags.growthMissionSessionV1) return;
    const built = buildMissionSession(summary, actionBundle);
    writeStored(built);
    setSession(built);
    recordMissionSessionStarted();
  }, [summary, actionBundle]);

  const markDone = React.useCallback((step: MissionSessionStep) => {
    setSession((prev) => {
      if (!prev || step.completed) return prev;
      const steps = prev.steps.map((s) => (s.id === step.id ? { ...s, completed: true } : s));
      const completedItemIds = [...new Set([...prev.completedItemIds, step.id])];
      const next = { ...prev, steps, completedItemIds };
      writeStored(next);
      recordMissionSessionStepCompleted({
        kind: step.type === "top_action" ? "top" : "other",
        navigation: Boolean(step.targetSurface && step.actionType !== "mark_done"),
      });
      return next;
    });
  }, []);

  const skipStep = React.useCallback((stepId: string) => {
    setSession((prev) => {
      if (!prev) return prev;
      const steps = prev.steps.map((s) => (s.id === stepId ? { ...s, completed: true } : s));
      const completedItemIds = [...new Set([...prev.completedItemIds, stepId])];
      const next = { ...prev, steps, completedItemIds };
      writeStored(next);
      recordMissionSessionStepCompleted({ kind: "other", navigation: false });
      return next;
    });
  }, []);

  const endSession = React.useCallback(
    (mode: "completed" | "abandoned") => {
      setSession((prev) => {
        if (!prev) return prev;
        const ended: MissionSession = {
          ...prev,
          status: mode === "completed" ? "completed" : "abandoned",
          endedAt: new Date().toISOString(),
        };
        if (mode === "completed") {
          writeStored(null);
          recordMissionSessionCompleted();
          return null;
        }
        writeStored(ended);
        recordMissionSessionAbandoned();
        return ended;
      });
    },
    [],
  );

  const resumeHref = (target?: MissionControlNavTarget | string) => {
    if (!target || typeof target !== "string") return `/${locale}/${country}/dashboard/growth?from=mission-session`;
    return buildMissionControlHref(locale, country, target as MissionControlNavTarget, {
      reason: "mission_session",
    });
  };

  if (!growthMissionControlFlags.growthMissionSessionPanelV1) {
    return null;
  }

  const summaryLine = session ? summarizeMissionSession(session) : null;
  const nextStep = session?.steps.find((s) => !s.completed);

  return (
    <div className="mt-4 rounded-lg border border-fuchsia-500/30 bg-fuchsia-950/15 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-fuchsia-200/90">Mission session</p>
        {!growthMissionControlFlags.growthMissionSessionV1 ? (
          <span className="text-[10px] text-zinc-500">Enable FEATURE_GROWTH_MISSION_SESSION_V1 to start.</span>
        ) : null}
      </div>
      <p className="mt-1 text-[11px] leading-relaxed text-zinc-400">
        Focused checklist — operators mark progress locally. Nothing auto-runs or auto-completes work.
      </p>

      {!session || session.status !== "active" ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!growthMissionControlFlags.growthMissionSessionV1}
            className="rounded-md border border-fuchsia-500/40 bg-fuchsia-950/40 px-3 py-1.5 text-[11px] font-semibold text-fuchsia-100 hover:bg-fuchsia-900/50 disabled:opacity-40"
            onClick={startSession}
          >
            Start session
          </button>
          {session?.status === "completed" || session?.status === "abandoned" ? (
            <p className="text-[11px] text-zinc-500">
              Last session {session.status} — {session.steps.filter((s) => s.completed).length}/{session.steps.length}{" "}
              steps checked.
            </p>
          ) : null}
        </div>
      ) : (
        <>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-400">
            <span>
              Progress: {summaryLine?.completedSteps ?? 0}/{summaryLine?.totalSteps ?? 0}
            </span>
            <div className="h-1.5 flex-1 min-w-[120px] rounded-full bg-zinc-800">
              <div
                className="h-1.5 rounded-full bg-fuchsia-500/70 transition-all"
                style={{
                  width: `${summaryLine && summaryLine.totalSteps > 0 ? (100 * summaryLine.completedSteps) / summaryLine.totalSteps : 0}%`,
                }}
              />
            </div>
          </div>

          {nextStep ? (
            <div className="mt-3 rounded-md border border-zinc-700/80 bg-black/25 p-2">
              <p className="text-[10px] font-semibold uppercase text-zinc-500">Now</p>
              <p className="mt-1 text-sm font-medium text-white">{nextStep.title}</p>
              <p className="mt-1 text-[11px] text-zinc-500">{nextStep.description.slice(0, 280)}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {nextStep.targetSurface && nextStep.actionType !== "mark_done" ? (
                  <Link
                    href={resumeHref(nextStep.targetSurface)}
                    className="rounded-md border border-fuchsia-500/35 bg-fuchsia-950/30 px-2.5 py-1 text-[11px] font-medium text-fuchsia-100 hover:bg-fuchsia-900/40"
                  >
                    Open panel
                  </Link>
                ) : null}
                <button
                  type="button"
                  className="rounded-md border border-zinc-600 px-2.5 py-1 text-[11px] text-zinc-200 hover:bg-zinc-800"
                  onClick={() => markDone(nextStep)}
                >
                  Mark done
                </button>
                <button
                  type="button"
                  className="rounded-md border border-transparent px-2 py-1 text-[11px] text-zinc-500 hover:text-zinc-300"
                  onClick={() => skipStep(nextStep.id)}
                >
                  Skip for now
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-[11px] text-emerald-200/90">All steps checked — end session when ready.</p>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-md border border-emerald-500/35 px-2.5 py-1 text-[11px] text-emerald-100 hover:bg-emerald-950/40"
              onClick={() => endSession("completed")}
            >
              End session
            </button>
            <button
              type="button"
              className="rounded-md border border-transparent px-2 py-1 text-[11px] text-zinc-500 hover:text-zinc-300"
              onClick={() => endSession("abandoned")}
            >
              Abandon
            </button>
          </div>
        </>
      )}
    </div>
  );
}
