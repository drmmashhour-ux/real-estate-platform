"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { AiCloserLivePanel } from "@/components/closing/AiCloserLivePanel";
import { CloserModePanel } from "@/components/closing/CloserModePanel";
import { PsychologyCoachPanel } from "@/components/sales-psychology/PsychologyCoachPanel";
import { analyzePostCallPsychology } from "@/modules/sales-psychology/psychology-suggestion.service";
import { analyzeTranscript } from "@/modules/call-intelligence/call-analysis.service";
import type { CallPerformanceVm } from "@/modules/call-center/call-center.types";
import { getLiveAssist } from "@/modules/call-center/call-live.service";
import type { CallStage } from "@/modules/call-assistant/call-assistant.types";
import type {
  SalesScriptCategory,
  ScriptAudience,
  ScriptContext,
} from "@/modules/sales-scripts/sales-script.types";

export function CallCenterAdminClient({
  dashBase,
  performance,
}: {
  dashBase: string;
  performance: CallPerformanceVm;
}) {
  const [transcript, setTranscript] = useState("");
  const [lastClient, setLastClient] = useState("");
  const [audience, setAudience] = useState<ScriptAudience>("BROKER");
  const [category, setCategory] = useState<SalesScriptCategory>("cold_call_broker");
  const [stage, setStage] = useState<CallStage>("opening");
  const [notes, setNotes] = useState("");
  const [closerMode, setCloserMode] = useState(true);

  const scriptContext: ScriptContext = useMemo(
    () => ({ audience, performanceTier: "average" }),
    [audience],
  );

  const assist = useMemo(
    () =>
      getLiveAssist(
        {
          transcript,
          lastClientSentence: lastClient || extractLastClientLine(transcript),
          audience,
          scriptCategory: category,
          stage,
        },
        scriptContext,
      ),
    [transcript, lastClient, audience, category, stage, scriptContext],
  );

  const postAnalytics = useMemo(() => analyzeTranscript(transcript), [transcript]);

  const postPsych = useMemo(
    () => (transcript.trim().length > 40 ? analyzePostCallPsychology(transcript) : null),
    [transcript],
  );

  const lastLine = lastClient || extractLastClientLine(transcript);

  const brokerCats: SalesScriptCategory[] = [
    "cold_call_broker",
    "follow_up_broker",
    "demo_booking_broker",
    "closing_broker",
  ];
  const investorCats: SalesScriptCategory[] = [
    "cold_call_investor",
    "pitch_investor",
    "follow_up_investor",
    "closing_investor",
  ];
  const cats = audience === "BROKER" ? brokerCats : investorCats;

  return (
    <div className="mx-auto flex max-w-[1680px] flex-col gap-8 p-6 text-white">
      <header className="rounded-2xl border border-white/10 bg-zinc-950/70 p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-400/90">
          Elite closer · call center
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Live assist desk</h1>
        <p className="mt-2 max-w-3xl text-sm text-zinc-400">
          Human places the call — this panel only surfaces script-aligned lines. No auto dial, no robotic voice outbound.
        </p>
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-zinc-500">
          <span>
            Calls logged ({performance.sinceDays}d):{" "}
            <strong className="text-white">{performance.callsLogged}</strong>
          </span>
          <span>
            Demos: <strong className="text-white">{performance.demosBooked}</strong>
          </span>
          <span>
            Demo rate:{" "}
            <strong className="text-white">{(performance.conversionRate * 100).toFixed(1)}%</strong>
          </span>
          {performance.topObjections[0] ? (
            <span>
              Top objection tag:{" "}
              <strong className="text-white">{performance.topObjections[0]?.label}</strong>
            </span>
          ) : null}
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-xs">
          <Link className="text-sky-300 underline" href={`${dashBase}/call-live`}>
            Full-screen live desk + mic
          </Link>
          <Link className="text-emerald-400 underline" href={`${dashBase}/admin/training`}>
            Training lab
          </Link>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* ACTIVE */}
        <section className="space-y-4 lg:col-span-8">
          <div className="rounded-2xl border border-white/10 bg-black/40 p-6">
            <h2 className="text-lg font-semibold text-white">1 · Active assist</h2>
            <label className="mt-4 block text-xs text-zinc-400">
              Live transcript (paste or type)
              <textarea
                className="mt-2 min-h-[140px] w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 font-mono text-sm text-white"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
              />
            </label>
            <label className="mt-4 block text-xs text-zinc-400">
              Last client sentence (optional override)
              <input
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/50 px-4 py-2 font-mono text-sm text-white"
                value={lastClient}
                onChange={(e) => setLastClient(e.target.value)}
                placeholder={extractLastClientLine(transcript)}
              />
            </label>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <label className="block text-xs text-zinc-400">
                Audience
                <select
                  className="mt-2 w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-sm text-white"
                  value={audience}
                  onChange={(e) => {
                    const a = e.target.value as ScriptAudience;
                    setAudience(a);
                    setCategory(a === "BROKER" ? "cold_call_broker" : "cold_call_investor");
                  }}
                >
                  <option value="BROKER">Broker</option>
                  <option value="INVESTOR">Investor</option>
                </select>
              </label>
              <label className="block text-xs text-zinc-400">
                Script
                <select
                  className="mt-2 w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-sm text-white"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as SalesScriptCategory)}
                >
                  {cats.map((c) => (
                    <option key={c} value={c}>
                      {c.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs text-zinc-400">
                Stage
                <select
                  className="mt-2 w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-sm text-white"
                  value={stage}
                  onChange={(e) => setStage(e.target.value as CallStage)}
                >
                  {(["opening", "pitch", "discovery", "closing", "objection"] as CallStage[]).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-[11px] uppercase text-zinc-500">Assist mode</span>
              <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-400">
                <input
                  type="checkbox"
                  checked={closerMode}
                  onChange={(e) => setCloserMode(e.target.checked)}
                  className="rounded border-white/20 bg-black"
                />
                Closer mode
              </label>
            </div>

            <div className="mt-8 rounded-2xl border border-emerald-900/35 bg-emerald-950/20 p-6">
              <p className="text-[11px] uppercase tracking-wide text-emerald-400/90">Suggested line</p>
              <p className="mt-4 text-2xl font-semibold leading-snug text-white md:text-3xl">{assist.suggested}</p>
              <p className="mt-4 text-sm text-zinc-400">{assist.nextStep}</p>
              <div className="mt-6 space-y-3">
                {assist.alternatives.map((alt, i) => (
                  <p key={i} className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-lg text-zinc-200">
                    {alt}
                  </p>
                ))}
              </div>
            </div>

            {closerMode ? (
              <div className="mt-6">
                <CloserModePanel
                  callStage={stage}
                  audience={audience}
                  lastProspectInput={lastLine}
                  transcriptSnippet={transcript.slice(-1200)}
                />
              </div>
            ) : null}

            <div className="mt-6">
              <AiCloserLivePanel transcript={transcript} lastLine={lastLine} route="call_center" />
            </div>

            <div className="mt-6">
              <PsychologyCoachPanel clientText={lastLine} compact transcript={transcript.slice(-1200)} />
            </div>

            <div className="mt-6 rounded-xl border border-white/10 bg-zinc-950/60 px-4 py-3 text-xs text-zinc-400">
              <strong className="text-zinc-300">Post-call heuristic</strong> — sentiment {postAnalytics.sentiment}, objections{" "}
              {postAnalytics.objectionsDetected.join(", ") || "none"}, likelihood ~{" "}
              {(postAnalytics.conversionLikelihood * 100).toFixed(0)}%
            </div>

            {postPsych ? (
              <div className="mt-4 rounded-xl border border-violet-900/30 bg-violet-950/25 px-4 py-3 text-xs text-zinc-300">
                <strong className="text-violet-200">Psychology recap</strong> — dominant tone:{" "}
                <span className="text-white">{postPsych.dominantState}</span>, stage{" "}
                <span className="text-white">{postPsych.dominantStage.replace(/_/g, " ")}</span>.
                {postPsych.missedOpportunities.length > 0 ? (
                  <p className="mt-2 text-zinc-400">Missed: {postPsych.missedOpportunities.join(" · ")}</p>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>

        {/* Sidebar */}
        <div className="flex flex-col gap-6 lg:col-span-4">
          <section className="rounded-2xl border border-white/10 bg-zinc-950/70 p-5">
            <h2 className="text-sm font-semibold text-white">2 · Quick responses</h2>
            <div className="mt-4 flex flex-col gap-2">
              <QuickBtn label="Not interested" text="I'm not interested" setLast={setLastClient} />
              <QuickBtn label="Busy" text="I'm too busy today" setLast={setLastClient} />
              <QuickBtn label="Need email first" text="Just send me an email" setLast={setLastClient} />
              <QuickBtn label="Closing — book demo" text="Let's put 10 minutes on the calendar" setLast={setLastClient} />
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-black/35 p-5">
            <h2 className="text-sm font-semibold text-white">3 · Notes</h2>
            <textarea
              className="mt-3 min-h-[120px] w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-sm text-white"
              placeholder="Facts-only notes during the call…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <p className="mt-3 text-[11px] text-zinc-600">
              Save outcomes through acquisition CRM / call log workflows — this panel stays lightweight for speed on the desk.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

function QuickBtn({
  label,
  text,
  setLast,
}: {
  label: string;
  text: string;
  setLast: (t: string) => void;
}) {
  return (
    <button
      type="button"
      className="rounded-xl border border-white/15 px-4 py-2 text-left text-sm text-zinc-200 hover:border-emerald-700"
      onClick={() => setLast(text)}
    >
      {label}
    </button>
  );
}

function extractLastClientLine(full: string): string {
  const lines = full
    .trim()
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  return lines[lines.length - 1] ?? "";
}
