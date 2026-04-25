"use client";

import Link from "next/link";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Sparkles, Timer, Play, Square, ChevronRight, ChevronLeft, CheckCircle2, Kanban, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { getDemoFlow, type DemoFlowStep } from "@/modules/growth/demo-flow";
import { BROKER_DEMO_TOP_DEAL, type DemoDealRow } from "@/modules/growth/demo-sample-data";
import type { PlatformRole } from "@prisma/client";

const SESSION_KEY = "lecipm_broker_demo_session_v1";

function getOrCreateSessionId() {
  if (typeof window === "undefined") return null;
  try {
    const x = window.sessionStorage.getItem(SESSION_KEY);
    if (x) return x;
    const id = crypto.randomUUID();
    window.sessionStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return `sess_${Date.now()}`;
  }
}

function postMetric(body: Record<string, unknown>) {
  return fetch("/api/growth/broker-demo/metrics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const card = "rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-[0_0_40px_rgb(0_0_0_/_0.35)]";

type Props = { userRole: PlatformRole; initialDemoParam: boolean };

export function BrokerDemoClient({ userRole, initialDemoParam }: Props) {
  const [flow, setFlow] = useState<ReturnType<typeof getDemoFlow> | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [assignDone, setAssignDone] = useState<null | { count: number; already: boolean }>(null);
  const lastStepView = useRef<string | null>(null);
  const completeFlowSent = useRef(false);
  const sessionId = useRef<string | null>(null);
  const demoStartSent = useRef(false);

  useEffect(() => {
    setFlow(getDemoFlow());
    sessionId.current = getOrCreateSessionId();
  }, []);

  const steps = flow?.steps ?? [];
  const current: DemoFlowStep | undefined = steps[stepIndex];

  useEffect(() => {
    if (!flow || !sessionId.current) return;
    if (demoStartSent.current) return;
    demoStartSent.current = true;
    void postMetric({ action: "demo_start", sessionId: sessionId.current });
  }, [flow]);

  useEffect(() => {
    if (!flow || !current || !sessionId.current) return;
    const key = `${current.id}@${stepIndex}`;
    if (lastStepView.current === key) return;
    lastStepView.current = key;
    void postMetric({ action: "step_view", stepId: current.id, stepIndex, sessionId: sessionId.current });
    if (current.id === "CLOSE" && !completeFlowSent.current) {
      completeFlowSent.current = true;
      void postMetric({ action: "complete_flow", stepId: "CLOSE", stepIndex, sessionId: sessionId.current });
    }
  }, [flow, current, stepIndex]);

  useEffect(() => {
    const onLeave = () => {
      if (!sessionId.current || !current) return;
      void postMetric({
        action: "drop_or_leave",
        stepId: current.id,
        stepIndex,
        sessionId: sessionId.current,
      });
    };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [current, stepIndex]);

  useEffect(() => {
    if (!autoPlay || !current) return;
    const ms = current.durationSec * 1000;
    const t = window.setTimeout(() => {
      if (stepIndex < steps.length - 1) {
        setStepIndex((i) => i + 1);
      } else {
        setAutoPlay(false);
      }
    }, ms);
    return () => clearTimeout(t);
  }, [autoPlay, current, stepIndex, steps.length]);

  const goNext = useCallback(() => {
    if (!flow || !sessionId.current) return;
    if (stepIndex < steps.length - 1) {
      void postMetric({ action: "step_next", stepId: steps[stepIndex]!.id, stepIndex, sessionId: sessionId.current });
      setStepIndex((i) => i + 1);
    }
  }, [flow, stepIndex, steps]);

  const goBack = useCallback(() => {
    if (!sessionId.current) return;
    if (stepIndex > 0) {
      void postMetric({ action: "step_back", stepId: steps[stepIndex]!.id, stepIndex, sessionId: sessionId.current });
      setStepIndex((i) => i - 1);
    }
  }, [stepIndex, steps]);

  const progressPct = flow ? ((stepIndex + 1) / steps.length) * 100 : 0;

  const toggleAuto = () => {
    if (!sessionId.current) return;
    setAutoPlay((a) => {
      const next = !a;
      void postMetric({ action: next ? "autoplay_on" : "autoplay_off", sessionId: sessionId.current! });
      return next;
    });
  };

  const onOnboarding = () => {
    if (sessionId.current) {
      void postMetric({ action: "onboarding_cta", stepId: "CLOSE", stepIndex, sessionId: sessionId.current });
    }
  };

  const onAssign = async () => {
    if (userRole === "OPERATOR") {
      return;
    }
    setAssigning(true);
    try {
      const res = await fetch("/api/growth/broker-demo/assign-sample", { method: "POST" });
      const j = (await res.json()) as { ok?: boolean; count?: number; alreadyAssigned?: boolean };
      if (res.ok) {
        setAssignDone({ count: j.count ?? 0, already: Boolean(j.alreadyAssigned) });
      }
    } finally {
      setAssigning(false);
    }
  };

  if (!flow) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center text-sm text-zinc-500">
        Loading demo…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 text-[#f4efe4] md:px-8">
      <header className="mb-6 flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#D4AF37]/80">Live call · {flow.headline}</p>
          <h1 className="mt-2 font-serif text-3xl text-[#f4efe4] md:text-4xl">Show the “aha” in one sitting</h1>
          <p className="mt-2 max-w-2xl text-sm text-neutral-400">
            About {Math.round(flow.totalDurationSec / 60)} minutes — stay plain, stay fast. This screen uses a sample list so you are never
            fumbling in someone&apos;s real pipeline on a call.
          </p>
          {initialDemoParam ? (
            <p className="mt-2 text-xs font-bold uppercase tracking-widest text-[#D4AF37]/80">
              demo=true — bookmark for live calls
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-400">
            <Timer className="h-3.5 w-3.5" />
            ~{flow.totalDurationSec}s total
          </span>
          <Button type="button" variant="ghost" onClick={toggleAuto} className="text-xs">
            {autoPlay ? <Square className="mr-1 h-3 w-3" /> : <Play className="mr-1 h-3 w-3" />}
            {autoPlay ? "Pause" : "Auto-advance"}
          </Button>
        </div>
      </header>

      <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full bg-gradient-to-r from-amber-700/80 to-[#D4AF37] transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-2">
          {steps.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                if (i !== stepIndex) {
                  if (i > stepIndex) void postMetric({ action: "step_next", stepId: s.id, stepIndex: i, sessionId: sessionId.current! });
                  else void postMetric({ action: "step_back", stepId: s.id, stepIndex: i, sessionId: sessionId.current! });
                }
                setStepIndex(i);
              }}
              className={`w-full text-left ${card} transition-colors ${
                i === stepIndex ? "border-[#D4AF37]/50 bg-[#D4AF37]/5" : "opacity-80 hover:opacity-100"
              }`}
            >
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Step {i + 1} · {s.durationSec}s
              </p>
              <p className="mt-1 text-sm font-semibold text-white">{s.title}</p>
            </button>
          ))}
        </div>

        <div className="space-y-4 lg:col-span-3">
          {current && (
            <div className={card}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]">What to say</p>
              <p className="mt-2 text-base leading-relaxed text-zinc-200">{current.script}</p>
              {current.uiCaption && <p className="mt-3 text-sm text-zinc-500">{current.uiCaption}</p>}
            </div>
          )}

          <div className={card}>{current && <DemoVisual focus={current.focus} />}</div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="ghost" onClick={goBack} disabled={stepIndex === 0} className="text-xs">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
            <Button type="button" variant="goldPrimary" onClick={goNext} disabled={stepIndex >= steps.length - 1} className="text-xs">
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
            {current?.focus === "close" && (
              <>
                <Button type="button" variant="goldPrimary" asChild className="text-xs">
                  <Link href="/onboarding/broker" onClick={onOnboarding}>
                    Start onboarding
                  </Link>
                </Button>
                {userRole !== "OPERATOR" && (
                  <Button type="button" variant="ghost" onClick={onAssign} disabled={assigning} className="text-xs">
                    {assigning ? "Adding…" : assignDone ? `Sample leads${assignDone.already ? " (already added)" : " added"}` : "Add sample leads to my CRM"}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DemoVisual({ focus }: { focus: DemoFlowStep["focus"] }) {
  if (focus === "hook") {
    return (
      <div className="space-y-3 text-center">
        <Sparkles className="mx-auto h-10 w-10 text-[#D4AF37]" />
        <p className="text-sm font-medium text-zinc-300">One screen. One priority. No long setup story.</p>
      </div>
    );
  }

  if (focus === "deal_list") {
    return <DealListHighlight />;
  }

  if (focus === "insight") {
    return <InsightPanel deal={BROKER_DEMO_TOP_DEAL} />;
  }

  if (focus === "next_action") {
    return <NextActionPanel deal={BROKER_DEMO_TOP_DEAL} />;
  }

  if (focus === "pipeline") {
    return <PipelineBar />;
  }

  if (focus === "close") {
    return (
      <div className="space-y-2 text-sm text-zinc-400">
        <CheckCircle2 className="h-8 w-8 text-emerald-500/80" />
        <p>They should feel: “I want this on my real files.” If yes — onboarding + optional sample pack end the call cleanly.</p>
      </div>
    );
  }

  return null;
}

function DealListHighlight() {
  const deals: DemoDealRow[] = BROKER_DEMO_DEALS;
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-zinc-500">Deals to review</p>
      {deals.map((d) => {
        const isTop = d.id === BROKER_DEMO_TOP_DEAL.id;
        return (
          <div
            key={d.id}
            className={`flex flex-col gap-2 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between ${
              isTop ? "border-amber-500/50 bg-amber-500/10 ring-1 ring-amber-500/30" : "border-white/5 bg-white/5"
            }`}
          >
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-white">{d.label}</span>
                {d.showHighPriority && (
                  <Badge variant="gold" className="text-[9px]">
                    High priority
                  </Badge>
                )}
                {d.showHighProbability && (
                  <Badge variant="active" className="text-[9px]">
                    High probability
                  </Badge>
                )}
              </div>
              <p className="text-xs text-zinc-500">{d.area}</p>
            </div>
            <div className="text-right text-xs text-zinc-400">
              <span className="font-bold text-amber-200/90">Score {d.closeScore}</span>
            </div>
            {isTop && (
              <p className="w-full text-xs text-amber-200/80 sm:col-span-2">This is your highest chance to close right now.</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function InsightPanel({ deal }: { deal: DemoDealRow }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-zinc-500">On this lead</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Chances to close</p>
          <p className="mt-1 text-2xl font-bold text-amber-200/90">{deal.closeScore}%</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Risk</p>
          <p className="mt-1 text-sm text-zinc-200">{deal.risk}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Engagement</p>
          <p className="mt-1 text-sm text-zinc-200">{deal.engagement}</p>
        </div>
      </div>
    </div>
  );
}

function NextActionPanel({ deal }: { deal: DemoDealRow }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-zinc-500">Suggested next move</p>
      <p className="text-sm text-zinc-200">{deal.suggestedAction}</p>
      <div>
        <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Message draft</p>
        <div className="rounded-xl border border-[#D4AF37]/20 bg-black/30 p-3 text-sm text-zinc-100">
          <MessageCircle className="mb-2 inline h-4 w-4 text-[#D4AF37]" />
          {deal.messageDraft}
        </div>
      </div>
    </div>
  );
}

function PipelineBar() {
  const flow = getDemoFlow();
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-zinc-500">Pipeline at a glance</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {flow.pipeline.map((p) => (
          <div key={p.stage} className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
            <Kanban className="mx-auto h-5 w-5 text-zinc-500" />
            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{p.stage}</p>
            <p className="text-2xl font-bold text-white">{p.count}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-zinc-500">You can manage the same list here — not a second spreadsheet that drifts.</p>
    </div>
  );
}
