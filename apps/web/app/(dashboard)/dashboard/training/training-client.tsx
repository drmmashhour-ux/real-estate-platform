"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { getSuggestedScript } from "@/lib/leads/smart-scripts";
import { ASSISTANT_OBJECTIONS } from "@/lib/leads/training-objections";
import { BROKER_SCRIPTS } from "@/lib/leads/scripts";
import { SALES_PIPELINE_STAGES, STAGE_COLUMN_LABEL } from "@/lib/leads/pipeline-stage";

const GOLD = "#C9A646";
const BG = "#0B0B0B";

const BEST_PRACTICES = [
  "Lead with empathy — confirm they have 2 minutes before pitching.",
  "Use the client’s first name once or twice per minute max (natural rhythm).",
  "Repeat back their goal: “So timing matters most — did I get that right?”",
  "Never argue; validate then reframe (“I hear you… here’s what I see in the data”).",
  "Always end with one clear next step and a time-bound follow-up.",
];

const CLOSING_TECHNIQUES = [
  "Assumptive close: “Does morning or evening work for our consultation?”",
  "Summary close: recap 3 benefits, then “Ready for me to send the summary?”",
  "Risk reversal: “No obligation — you decide after you see the net sheet.”",
];

const CALL_STRUCTURE = [
  "Rapport (10–20s): name, reason for call, permission to continue.",
  "Discovery: goals, timeline, concerns — one question at a time.",
  "Value bridge: tie their answers to comparables, process, and next step.",
  "Trial close: “Does a short consultation this week make sense?”",
];

const ROLEPLAY_SCENARIO = {
  clientSays: "I want to sell myself",
  options: [
    {
      id: "a",
      text: "You’ll lose money without a broker — that’s just facts.",
      correct: false,
      feedback: "Too confrontational. Validate first, then compare net outcomes with data.",
    },
    {
      id: "b",
      text: "Many homeowners try FSBO first. May I show you a simple net comparison for your area?",
      correct: true,
      feedback: "Correct — respect + curiosity + a concrete offer of value.",
    },
    {
      id: "c",
      text: "Okay — good luck!",
      correct: false,
      feedback: "You gave up the conversation. Offer information with no pressure instead.",
    },
  ],
};

export function TrainingHubClient() {
  const [tab, setTab] = useState<"scripts" | "objections" | "structure" | "closing" | "practice" | "roleplay">(
    "scripts"
  );
  const [stagePick, setStagePick] = useState<string>("new");
  const [rolePick, setRolePick] = useState<string | null>(null);
  const [callMode, setCallMode] = useState(false);

  const demoScript = useMemo(
    () =>
      getSuggestedScript({
        pipelineStatus: stagePick,
        name: "Client",
        city: "Montreal",
        propertyType: "Condo",
        dealValue: 650_000,
      }),
    [stagePick]
  );

  const roleFeedback = rolePick
    ? ROLEPLAY_SCENARIO.options.find((o) => o.id === rolePick)?.feedback
    : null;
  const roleCorrect = rolePick
    ? ROLEPLAY_SCENARIO.options.find((o) => o.id === rolePick)?.correct
    : null;

  return (
    <main className="min-h-screen text-white" style={{ background: BG }}>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: GOLD }}>
              LECIPM Training
            </p>
            <h1 className="mt-2 text-3xl font-bold">Sales &amp; closing</h1>
            <p className="mt-2 max-w-xl text-sm text-[#B3B3B3]">
              Mohamed Al Mashhour — residential broker workflows, scripts, and objection practice.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setCallMode(true)}
              className="rounded-xl bg-[#C9A646] px-4 py-2 text-sm font-bold text-[#0B0B0B]"
            >
              Start call mode
            </button>
            <Link href="/dashboard/leads" className="text-sm font-medium text-[#C9A646] hover:underline">
              ← CRM
            </Link>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-2 border-b border-white/10 pb-4">
          {(
            [
              ["scripts", "Scripts"],
              ["objections", "Objections"],
              ["structure", "Call structure"],
              ["closing", "Closing"],
              ["practice", "Best practices"],
              ["roleplay", "Roleplay"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                tab === k ? "bg-[#C9A646] text-[#0B0B0B]" : "border border-white/15 text-[#B3B3B3]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "scripts" ? (
          <section className="mt-8 space-y-6">
            <div>
              <label className="text-xs font-semibold uppercase text-[#737373]">Pipeline stage</label>
              <select
                value={stagePick}
                onChange={(e) => setStagePick(e.target.value)}
                className="mt-2 w-full max-w-md rounded-xl border border-white/15 bg-[#121212] px-3 py-2 text-sm text-white"
              >
                {SALES_PIPELINE_STAGES.filter((s) => s !== "won" && s !== "lost").map((s) => (
                  <option key={s} value={s}>
                    {STAGE_COLUMN_LABEL[s] ?? s}
                  </option>
                ))}
              </select>
            </div>
            <div className="rounded-2xl border border-[#C9A646]/30 bg-[#121212] p-6">
              <h2 className="text-lg font-bold text-[#C9A646]">{demoScript.title}</h2>
              <dl className="mt-4 space-y-4 text-sm">
                <div>
                  <dt className="text-xs font-bold uppercase text-[#737373]">Opening</dt>
                  <dd className="mt-1 leading-relaxed text-white">{demoScript.opening}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase text-[#737373]">Questions</dt>
                  <dd className="mt-1 leading-relaxed text-[#B3B3B3]">{demoScript.questions}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase text-[#737373]">Value</dt>
                  <dd className="mt-1 leading-relaxed text-[#B3B3B3]">{demoScript.valueStatement}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase text-[#737373]">Closing question</dt>
                  <dd className="mt-1 text-[#E8C547]">{demoScript.closingQuestion}</dd>
                </div>
              </dl>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#121212] p-6">
              <h3 className="text-sm font-bold text-white">Voicemail / WhatsApp</h3>
              <p className="mt-2 text-sm text-[#B3B3B3]">{BROKER_SCRIPTS.voicemail}</p>
              <p className="mt-3 text-sm text-[#B3B3B3]">{BROKER_SCRIPTS.whatsappFollowUp}</p>
            </div>
          </section>
        ) : null}

        {tab === "objections" ? (
          <ul className="mt-8 space-y-4">
            {ASSISTANT_OBJECTIONS.map((o) => (
              <li key={o.id} className="rounded-2xl border border-white/10 bg-[#121212] p-5">
                <p className="font-semibold text-[#C9A646]">{o.objection}</p>
                <p className="mt-2 text-sm font-medium text-[#E8C547]">{o.shortAnswer}</p>
                <p className="mt-2 text-sm leading-relaxed text-[#B3B3B3]">{o.fullScript}</p>
              </li>
            ))}
          </ul>
        ) : null}

        {tab === "structure" ? (
          <section className="mt-8 rounded-2xl border border-[#C9A646]/30 bg-[#121212] p-6">
            <h2 className="text-lg font-bold text-[#C9A646]">Call structure</h2>
            <ol className="mt-4 list-decimal space-y-4 pl-5 text-sm leading-relaxed text-[#B3B3B3]">
              {CALL_STRUCTURE.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
            <p className="mt-6 text-xs text-[#737373]">
              On a live lead, open <span className="text-[#C9A646]">Start call mode</span> or use{" "}
              <Link href="/dashboard/leads" className="text-[#C9A646] hover:underline">
                Sales Assistant
              </Link>{" "}
              on any lead.
            </p>
          </section>
        ) : null}

        {tab === "closing" ? (
          <section className="mt-8 rounded-2xl border border-[#C9A646]/30 bg-[#121212] p-6">
            <h2 className="text-lg font-bold text-[#C9A646]">Closing techniques</h2>
            <ul className="mt-4 space-y-3 text-sm text-[#B3B3B3]">
              {CLOSING_TECHNIQUES.map((p) => (
                <li key={p} className="rounded-lg border border-white/5 bg-black/20 p-4">
                  {p}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {tab === "practice" ? (
          <div className="mt-8 rounded-2xl border border-[#C9A646]/25 bg-[#121212] p-6">
            <h2 className="text-lg font-bold text-white">Best practices</h2>
            <ul className="mt-4 list-inside list-disc space-y-2 text-sm text-[#B3B3B3]">
              {BEST_PRACTICES.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {tab === "roleplay" ? (
          <section className="mt-8 rounded-2xl border border-[#C9A646]/40 bg-[#121212] p-6">
            <h2 className="text-lg font-bold text-[#C9A646]">Practice with client</h2>
            <p className="mt-4 rounded-xl border border-white/10 bg-[#0B0B0B] p-4 text-base text-white">
              <span className="text-[#737373]">Client:</span> “{ROLEPLAY_SCENARIO.clientSays}”
            </p>
            <p className="mt-4 text-sm font-semibold text-white">Pick your reply:</p>
            <div className="mt-3 space-y-2">
              {ROLEPLAY_SCENARIO.options.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setRolePick(o.id)}
                  className={`w-full rounded-xl border px-4 py-3 text-left text-sm ${
                    rolePick === o.id
                      ? "border-[#C9A646] bg-[#C9A646]/15 text-white"
                      : "border-white/15 text-[#B3B3B3] hover:border-[#C9A646]/40"
                  }`}
                >
                  {o.text}
                </button>
              ))}
            </div>
            {rolePick ? (
              <div
                className={`mt-6 rounded-xl border p-4 text-sm ${
                  roleCorrect
                    ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-100"
                    : "border-amber-500/40 bg-amber-950/20 text-amber-100"
                }`}
              >
                <p className="font-bold">{roleCorrect ? "✓ Strong choice" : "↳ Improve"}</p>
                <p className="mt-2">{roleFeedback}</p>
              </div>
            ) : null}
          </section>
        ) : null}

        {callMode ? (
          <div
            className="fixed inset-0 z-[90] flex flex-col bg-[#050505] px-4 py-6 text-white sm:px-8"
            role="dialog"
            aria-modal="true"
            aria-label="Practice call mode"
          >
            <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col">
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs font-bold uppercase tracking-widest text-[#C9A646]">Practice call mode</p>
                <button
                  type="button"
                  onClick={() => setCallMode(false)}
                  className="rounded-lg border border-white/20 px-3 py-1.5 text-sm text-[#B3B3B3] hover:bg-white/5"
                >
                  Exit
                </button>
              </div>
              <p className="mt-2 text-xs text-[#737373]">
                Stage: {STAGE_COLUMN_LABEL[stagePick] ?? stagePick} — Open a real lead in CRM for live tracking.
              </p>
              <div className="mt-6 flex-1 overflow-y-auto rounded-2xl border border-[#C9A646]/25 bg-[#121212] p-6">
                <h2 className="text-xl font-bold text-white">{demoScript.title}</h2>
                <p className="mt-6 text-lg font-medium leading-relaxed text-white">{demoScript.opening}</p>
                <p className="mt-6 text-base leading-relaxed text-[#B3B3B3]">{demoScript.questions}</p>
                <p className="mt-6 text-base leading-relaxed text-[#B3B3B3]">{demoScript.valueStatement}</p>
                <p className="mt-6 text-lg font-semibold text-[#E8C547]">{demoScript.closingQuestion}</p>
                <ul className="mt-8 list-inside list-disc space-y-2 text-base text-white">
                  {demoScript.keyQuestions.map((q) => (
                    <li key={q}>{q}</li>
                  ))}
                </ul>
              </div>
              <Link
                href="/dashboard/leads"
                className="mt-4 block text-center text-sm font-semibold text-[#C9A646] hover:underline"
              >
                Open CRM for live call mode →
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
