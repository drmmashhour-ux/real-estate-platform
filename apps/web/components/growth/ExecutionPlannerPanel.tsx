"use client";

import * as React from "react";
import type {
  BlockedExecutionTask,
  ExecutionPlan,
  ExecutionTask,
  ExecutionTaskCategory,
} from "@/modules/growth/execution-planner.types";
import type { ApprovalRecord } from "@/modules/growth/execution-planner-approval.service";
import type { SimulationActionInput } from "@/modules/growth/action-simulation.types";
import { presetAndScrollToActionSimulation } from "./growth-action-simulation-preset";
import { buildExecutionPlannerNavigationHref } from "@/modules/growth/growth-task-navigation";
import { trackTaskSurfaceOpened } from "@/modules/growth/execution-planner-approval.service";

type EnrichedTask = ExecutionTask & { approval: ApprovalRecord };
type EnrichedPlan = Omit<ExecutionPlan, "todayTasks" | "weeklyTasks" | "blockedTasks"> & {
  todayTasks: EnrichedTask[];
  weeklyTasks: EnrichedTask[];
  blockedTasks: (BlockedExecutionTask & { approval: ApprovalRecord })[];
};

function sourceLabel(s: ExecutionTask["source"]): string {
  switch (s) {
    case "allocation":
      return "Capital allocation";
    case "weekly_review":
      return "Weekly review";
    case "ai_assist":
      return "AI execution assist";
    case "domination_plan":
      return "City domination plan";
    case "flywheel":
      return "Marketplace flywheel (suggest)";
    case "mission_control":
      return "Mission control bridge";
    default:
      return s;
  }
}

function simCategoryFromPlanner(cat: ExecutionTaskCategory): SimulationActionInput["category"] {
  switch (cat) {
    case "broker":
      return "broker_acquisition";
    case "conversion":
      return "conversion_fix";
    case "expansion":
      return "city_domination";
    case "scaling":
      return "supply_growth";
    case "revenue":
      return "demand_generation";
    case "bnhub":
      return "supply_growth";
    case "ops":
      return "timing_focus";
    case "sourcing":
      return "broker_acquisition";
    default:
      return "demand_generation";
  }
}

export function ExecutionPlannerPanel({
  locale,
  country,
  simulateOutcomeEnabled = false,
}: {
  locale: string;
  country: string;
  simulateOutcomeEnabled?: boolean;
}) {
  const [plan, setPlan] = React.useState<EnrichedPlan | null | "err" | "loading">("loading");
  const [disclaimer, setDisclaimer] = React.useState("");

  const load = React.useCallback(() => {
    const params = new URLSearchParams({ windowDays: "14" });
    return fetch(`/api/growth/execution-planner/plan?${params}`, { credentials: "same-origin" }).then((r) => {
      if (!r.ok) return null;
      return r.json() as Promise<{ plan: EnrichedPlan; disclaimer?: string }>;
    });
  }, []);

  React.useEffect(() => {
    let cancel = false;
    void (async () => {
      const j = await load();
      if (cancel) return;
      if (!j) {
        setPlan("err");
        return;
      }
      setPlan(j.plan);
      setDisclaimer(j.disclaimer ?? "");
    })();
    return () => {
      cancel = true;
    };
  }, [load]);

  const setApproval = React.useCallback(
    async (taskId: string, action: "approve" | "deny", reason?: string) => {
      const res = await fetch("/api/growth/execution-planner/approval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ taskId, action, reason }),
      });
      if (res.ok) {
        const j = await load();
        if (j) {
          setPlan(j.plan);
        }
      }
    },
    [load],
  );

  if (plan === "loading") {
    return (
      <section className="rounded-xl border border-violet-900/45 bg-violet-950/15 p-4" data-growth-execution-planner>
        <p className="text-xs text-zinc-500">Loading execution planner…</p>
      </section>
    );
  }

  if (plan === "err" || !plan) {
    return (
      <section className="rounded-xl border border-violet-900/45 bg-violet-950/15 p-4" data-growth-execution-planner>
        <p className="text-sm text-amber-200/90">Execution planner unavailable — enable planner flag and growth access.</p>
      </section>
    );
  }

  const renderExecutable = (t: EnrichedTask, compact: boolean) => {
    const href = buildExecutionPlannerNavigationHref({
      locale,
      country,
      taskId: t.id,
      targetSurface: t.targetSurface,
    });
    const ap = t.approval.status;

    return (
      <li key={t.id} className="rounded-lg border border-zinc-800/90 bg-black/30 p-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-zinc-100">{t.title}</p>
            <p className="mt-1 text-[11px] text-zinc-500">
              Source: <span className="text-zinc-400">{sourceLabel(t.source)}</span>
              {" · "}
              <span className="uppercase text-zinc-500">{t.priority}</span>
              {" · "}
              <span className="capitalize text-zinc-400">{t.confidence}</span>
              {" · "}
              <span className="text-zinc-600">{t.actionType}</span>
            </p>
            <p className="mt-2 text-xs text-zinc-500">{t.rationale}</p>
            {!compact ? <p className="mt-2 text-xs text-zinc-400">{t.description}</p> : null}
          </div>
          <div className="flex shrink-0 flex-col gap-2">
            <a
              href={href}
              className="rounded-lg border border-zinc-600 bg-zinc-900/60 px-3 py-1.5 text-center text-[11px] font-semibold uppercase tracking-wide text-zinc-200 hover:bg-zinc-800"
              onClick={() => void trackTaskSurfaceOpened(t.id)}
            >
              Open surface
            </a>
            {simulateOutcomeEnabled ? (
              <button
                type="button"
                className="rounded-lg border border-violet-800/60 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-violet-200/90 hover:bg-violet-950/40"
                onClick={() =>
                  presetAndScrollToActionSimulation({
                    title: t.title.slice(0, 200),
                    category: simCategoryFromPlanner(t.category),
                    rationale: `${t.rationale.slice(0, 400)} · target: ${t.target}`,
                    windowDays: 14,
                    intensity: t.effort === "high" ? "high" : t.effort === "medium" ? "medium" : "low",
                  })
                }
              >
                Simulate outcome
              </button>
            ) : null}
            {ap === "pending_approval" ? (
              <div className="flex gap-1">
                <button
                  type="button"
                  className="rounded-lg bg-emerald-900/50 px-2 py-1 text-[10px] font-semibold text-emerald-200 hover:bg-emerald-800/60"
                  onClick={() => void setApproval(t.id, "approve")}
                >
                  Approve
                </button>
                <button
                  type="button"
                  className="rounded-lg bg-rose-950/60 px-2 py-1 text-[10px] font-semibold text-rose-200 hover:bg-rose-900/60"
                  onClick={() => void setApproval(t.id, "deny", "Operator declined in planner")}
                >
                  Deny
                </button>
              </div>
            ) : (
              <span className="text-[10px] uppercase text-zinc-500">
                {ap === "approved" ? "Approved (internal)" : `Denied${t.approval.reason ? `: ${t.approval.reason}` : ""}`}
              </span>
            )}
          </div>
        </div>
        {t.warnings.length ? (
          <ul className="mt-2 list-inside list-disc text-[11px] text-amber-200/85">
            {t.warnings.slice(0, 8).map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        ) : null}
      </li>
    );
  };

  const todayShow = plan.todayTasks.slice(0, 5);
  const weekShow = plan.weeklyTasks.slice(0, 10);

  return (
    <section className="rounded-xl border border-violet-800/55 bg-gradient-to-br from-violet-950/25 to-black/40 p-4" data-growth-execution-planner>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300/95">Today &amp; week</p>
          <h3 className="mt-1 text-lg font-semibold text-zinc-50">Execution planner (approval required)</h3>
          <p className="mt-1 max-w-3xl text-[11px] text-zinc-500">{disclaimer}</p>
        </div>
        <span className="rounded-full border border-zinc-700 bg-black/40 px-2 py-1 text-[10px] font-medium text-zinc-400">
          {new Date(plan.generatedAt).toLocaleString()}
        </span>
      </div>

      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400/90">Today</p>
          <ul className="mt-3 space-y-2">{todayShow.map((t) => renderExecutable(t, false))}</ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-400/90">This week</p>
          <ul className="mt-3 space-y-2">{weekShow.map((t) => renderExecutable(t, true))}</ul>
        </div>
      </div>

      {plan.blockedTasks.length ? (
        <div className="mt-6 rounded-lg border border-amber-900/35 bg-black/35 p-3">
          <p className="text-xs font-semibold uppercase text-amber-300/90">Blocked</p>
          <ul className="mt-3 space-y-3">
            {plan.blockedTasks.map((t) => (
              <li key={t.id} className="rounded-md border border-zinc-800/80 p-2 text-sm">
                <p className="font-medium text-zinc-300">{t.title}</p>
                <p className="mt-1 text-[11px] text-rose-300/90">{t.blockReason}</p>
                <p className="mt-1 text-[11px] text-zinc-500">Unblock: {t.unblockSuggestion}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {plan.insights.length ? (
        <div className="mt-4 rounded-lg border border-zinc-800 p-3 text-sm text-zinc-500">
          <ul className="space-y-1">
            {plan.insights.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
